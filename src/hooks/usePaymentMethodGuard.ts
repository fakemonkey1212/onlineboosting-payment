import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const usePaymentMethodGuard = (methodId: string) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const redirect = () => {
      navigate(
        `/payment-cancelled?channel=${methodId}&reason=Payment method is currently unavailable&amount=${amount}`,
        { replace: true }
      );
      setIsAllowed(false);
    };

    const check = async () => {
      try {
        const { data } = await supabase
          .from("payment_methods")
          .select("enabled")
          .eq("id", methodId)
          .single();

        if (!data || !data.enabled) {
          redirect();
        } else {
          setIsAllowed(true);
        }
      } catch {
        setIsAllowed(true);
      }
    };
    check();

    // Realtime: instantly kick users out if admin disables the method
    const channel = supabase
      .channel(`payment_method_guard_${methodId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "payment_methods", filter: `id=eq.${methodId}` },
        (payload) => {
          if (payload.new && (payload.new as { enabled: boolean }).enabled === false) {
            redirect();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [methodId, navigate, amount]);

  return isAllowed;
};
