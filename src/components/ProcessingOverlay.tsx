import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/userId";

// 2 minutes
const PROCESS_DURATION_MS = 2 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;
const SEEN_KEY = "genz_process_seen_v1";
const ACTIVE_KEY = "genz_process_active_v1";

const ProcessingOverlay = () => {
  const [active, setActive] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem(ACTIVE_KEY);
      if (!v) return null;
      const started = Number(v);
      if (!Number.isFinite(started)) return null;
      if (Date.now() - started >= PROCESS_DURATION_MS) {
        localStorage.removeItem(ACTIVE_KEY);
        return null;
      }
      return started;
    } catch {
      return null;
    }
  });
  const [remaining, setRemaining] = useState<number>(() =>
    active ? Math.max(0, PROCESS_DURATION_MS - (Date.now() - active)) : PROCESS_DURATION_MS
  );
  const pollRef = useRef<number | null>(null);

  // Poll for admin's Process click.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled || active) return;
      try {
        const { data, error } = await supabase.functions.invoke("process-check", {
          body: { user_id: getUserId() },
        });
        if (error || cancelled) return;
        const res = data as { status?: string; id?: string } | null;
        if (res?.status === "approved" && res.id) {
          const seen = (() => {
            try { return localStorage.getItem(SEEN_KEY) || ""; } catch { return ""; }
          })();
          if (seen === res.id) return;
          try { localStorage.setItem(SEEN_KEY, res.id); } catch {}
          const started = Date.now();
          try { localStorage.setItem(ACTIVE_KEY, String(started)); } catch {}
          setActive(started);
          setRemaining(PROCESS_DURATION_MS);
        }
      } catch {}
    };
    tick();
    pollRef.current = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [active]);

  // Countdown while active.
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => {
      const left = Math.max(0, PROCESS_DURATION_MS - (Date.now() - active));
      setRemaining(left);
      if (left <= 0) {
        try { localStorage.removeItem(ACTIVE_KEY); } catch {}
        setActive(null);
        window.clearInterval(t);
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [active]);

  if (!active) return null;

  const totalSec = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Processing your payment</h2>
        <p className="text-sm text-gray-600 mb-4">
          Please wait while we verify your transaction. Do not close this window.
        </p>
        <div className="text-2xl font-mono font-bold text-blue-600 tabular-nums">
          {mm}:{ss}
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
