import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Upload, X, Headphones, HelpCircle, Gift, LogOut } from "lucide-react";
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

type PaymentMethod = {
  id: string;
  name: string;
  enabled: boolean;
  updated_at: string;
};

const methodsMeta = [
  { id: 'bkash', logo: bkashLogo, alt: 'bKash', h: 'h-12 md:h-14' },
  { id: 'nagad', logo: nagadLogo, alt: 'Nagad', h: 'h-12 md:h-14' },
  { id: 'rocket', logo: rocketLogo, alt: 'Rocket', h: 'h-12 md:h-14' },
  { id: 'upay', logo: upayLogo, alt: 'Upay', h: 'h-12 md:h-14' },
  { id: 'visa', logo: visaLogo, alt: 'VISA', h: 'h-10 md:h-12' },
  { id: 'mastercard', logo: mastercardLogo, alt: 'Mastercard', h: 'h-12 md:h-14' },
  { id: 'troy', logo: troyLogo, alt: 'Troy', h: 'h-10 md:h-12' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogin = () => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setLoginError("");
      sessionStorage.setItem("admin_logged_in", "true");
    } else {
      setLoginError("Invalid email or password");
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_logged_in") === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchMethods = async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .order("id");
      if (data) setMethods(data);
      setLoading(false);
    };

    fetchMethods();

    const channel = supabase
      .channel("payment_methods_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "payment_methods" },
        (payload) => {
          setMethods((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? (payload.new as PaymentMethod) : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn]);

  const toggleMethod = async (id: string, enabled: boolean) => {
    await supabase
      .from("payment_methods")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", id);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_logged_in");
    setIsLoggedIn(false);
    navigate("/");
  };

  const getMethodState = (id: string) => {
    const m = methods.find((m) => m.id === id);
    return m?.enabled ?? false;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6 space-y-4">
          <h1 className="text-xl font-bold text-foreground text-center">Admin Login</h1>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {loginError && (
            <p className="text-sm text-destructive text-center">{loginError}</p>
          )}
          <Button onClick={handleLogin} className="w-full">
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-start md:items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="w-full max-w-[520px] md:max-w-[700px] lg:max-w-[800px] flex flex-col h-full md:max-h-[720px]">
        <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-center px-3 py-2 md:px-5 md:py-3">
            <div className="bg-card rounded-lg flex items-center justify-between w-full px-4 py-2 shadow-sm">
              <Home className="w-4 h-4 text-foreground cursor-pointer" strokeWidth={1.5} onClick={() => navigate("/")} />
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleLogout} className="h-7 px-2 text-xs">
                  <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
                </Button>
                <X className="w-4 h-4 text-foreground cursor-pointer" strokeWidth={1.5} onClick={() => navigate("/")} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-3 md:px-6 pb-16 md:pb-6 flex flex-col">
            {/* GenZ Logo */}
            <div className="flex justify-center mt-1 mb-2">
              <img src={genzLogo} alt="GenZ" className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover" />
            </div>

            {/* Title Section */}
            <div className="text-center mb-2">
              <h1 className="text-foreground text-base md:text-xl font-bold mb-0.5">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm md:text-base font-normal">Payment Method Control</p>
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
            </div>

            {/* Mobile Banking Button */}
            <button className="w-full bg-primary text-primary-foreground py-2 md:py-2.5 rounded-lg font-medium text-sm mb-3 tracking-wide">
              মোবাইল ব্যাংকিং
            </button>

            {/* Payment Methods Grid with toggles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
              {loading ? (
                <div className="col-span-full text-center text-muted-foreground py-4">Loading...</div>
              ) : (
                methodsMeta.map((meta) => {
                  const enabled = getMethodState(meta.id);
                  return (
                    <div
                      key={meta.id}
                      className={`relative bg-transparent md:bg-card rounded-lg border border-border flex items-center justify-center h-[70px] md:h-20 overflow-hidden ${!enabled ? 'opacity-50' : ''}`}
                    >
                      <img src={meta.logo} alt={meta.alt} className={`${meta.h} object-contain`} />
                      <div className="absolute bottom-1 right-1">
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => toggleMethod(meta.id, checked)}
                          className="scale-75"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer - Desktop/Tablet only */}
          <div className="hidden md:block bg-pay-bar py-3 text-center rounded-b-2xl mt-auto">
            <span className="text-primary font-bold text-lg">Admin Panel</span>
          </div>
        </div>

        {/* Footer - Mobile only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-pay-bar py-3 text-center">
          <span className="text-primary font-bold text-base">Admin Panel</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
