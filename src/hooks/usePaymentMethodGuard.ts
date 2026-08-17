import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { getEnabledPaymentMethods } from "@/lib/backend-api";
import { supabase } from "@/integrations/supabase/client";

export const usePaymentMethodGuard = (methodId: string) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get('amount') || "00";
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const enabledRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const redirect = () => {
      navigate(
        `/payment-cancelled?channel=${methodId}&reason=Payment method is currently unavailable&amount=${amount}`,
        { replace: true }
      );
      setIsAllowed(false);
    };

    const evaluate = (enabled: Set<string>) => {
      enabledRef.current = enabled;
      if (cancelled) return;
      const allowed = methodId === 'card'
        ? enabled.has('visa') || enabled.has('mastercard')
        : enabled.has(methodId);
      if (!allowed) redirect(); else setIsAllowed(true);
    };

    const check = async () => {
      try {
        const data = await getEnabledPaymentMethods();
        evaluate(new Set<string>(data ?? []));
      } catch {
        if (!cancelled) setIsAllowed(true);
      }
    };
    check();

    const onVisibility = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisibility);

    const channel = supabase.channel('payment_methods_sync', {
      config: { broadcast: { self: false } },
    });
    channel
      .on('broadcast', { event: 'update' }, (msg) => {
        const payload = (msg as any)?.payload as { id?: string; enabled?: boolean } | undefined;
        if (payload && payload.id && typeof payload.enabled === 'boolean') {
          const next = new Set(enabledRef.current ?? []);
          if (payload.enabled) next.add(payload.id); else next.delete(payload.id);
          evaluate(next);
        } else {
          check();
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(channel);
    };
  }, [methodId, navigate, amount]);

  return isAllowed;
};
