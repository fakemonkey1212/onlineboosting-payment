import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";

const ADMIN_EMAIL = "abir789@gmail.com";
const ADMIN_PASSWORD = "778899";

type PaymentMethod = {
  id: string;
  name: string;
  enabled: boolean;
  updated_at: string;
};

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

    // Subscribe to realtime changes
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
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-foreground">Payment Methods</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>

        <div className="bg-card rounded-2xl shadow-sm divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading...</div>
          ) : (
            methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <span className="font-medium text-foreground">{method.name}</span>
                <Switch
                  checked={method.enabled}
                  onCheckedChange={(checked) => toggleMethod(method.id, checked)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
