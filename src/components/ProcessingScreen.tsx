import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import sslcommerzLogo from "@/assets/sslcommerzLogo";

export const PROCESSING_DURATION_MS = 2000;
export const PROCESSING_MESSAGES = [
  "Connecting to secure payment gateway...",
  "Verifying merchant credentials...",
  "Authorizing transaction...",
  "Communicating with bank server...",
  "Finalizing secure gateway...",
];

// This screen always shows the same brand, so it never waits on admin-managed
// logo or name data.
export const PROCESSING_BRAND_NAME = "SSLCommerz Secure Gateway";

// One shared clock per page opening, so the screen continues seamlessly while
// access checks finish and the payment page takes over.
let startedAt: number | null = null;
const elapsed = () => {
  if (startedAt === null) startedAt = Date.now();
  return Date.now() - startedAt;
};
export const processingRemainingMs = () => Math.max(0, PROCESSING_DURATION_MS - elapsed());

const ProcessingScreen = () => {
  const [startOffset] = useState(elapsed);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const step = PROCESSING_DURATION_MS / PROCESSING_MESSAGES.length;
    const tick = () => setMessageIndex(Math.min(PROCESSING_MESSAGES.length - 1, Math.floor(elapsed() / step)));
    tick();
    const t = window.setInterval(tick, 100);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div role="status" aria-label="Processing your payment" className="min-h-[100dvh] w-screen bg-background flex items-center justify-center p-4 overflow-hidden fixed inset-0 z-50">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gradient-to-br from-[#2d7dd2] via-[#2570c4] to-[#1a5fb4] rounded-2xl shadow-[0_20px_60px_rgba(26,95,180,0.4)] p-8 flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className="flex gap-3 mb-7 relative z-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white" style={{ animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />
            ))}
          </div>
          <img src={sslcommerzLogo} alt={PROCESSING_BRAND_NAME} className="h-9 w-auto mb-5 relative z-10" />
          <h2 className="text-white text-xl font-bold mb-2 relative z-10 tracking-wide">Processing Your Payment...</h2>
          <p className="text-white/75 text-sm mb-6 transition-all duration-500 min-h-[20px] relative z-10">{PROCESSING_MESSAGES[messageIndex]}</p>
          <div className="w-full bg-white/20 rounded-full h-2.5 mb-6 overflow-hidden relative z-10 backdrop-blur-sm">
            <div
              className="h-full rounded-full"
              style={{
                width: '100%', transformOrigin: 'left',
                animation: `processingFill ${PROCESSING_DURATION_MS}ms linear ${-startOffset}ms both`,
                background: 'linear-gradient(90deg, #ffffff 0%, #e0ecff 50%, #ffffff 100%)', boxShadow: '0 0 10px rgba(255,255,255,0.5)',
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-white/90 mb-2 relative z-10">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wide">{PROCESSING_BRAND_NAME}</span>
          </div>
          <p className="text-white/40 text-xs relative z-10">Please do not close or refresh this page</p>
        </div>
      </div>
      <style>{`
        @keyframes dotBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes processingFill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;
