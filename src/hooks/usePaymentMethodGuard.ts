import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const usePaymentMethodGuard = (methodId: string) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await supabase
          .from("payment_methods")
          .select("enabled")
          .eq("id", methodId)
          .single();

        if (!data || !data.enabled) {
          navigate(
            `/payment-cancelled?channel=${methodId}&reason=Payment method is currently unavailable&amount=${amount}.00`,
            { replace: true }
          );
        }
      } catch {
        // If check fails, allow page to load
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [methodId, navigate, amount]);

  return checking;
};
