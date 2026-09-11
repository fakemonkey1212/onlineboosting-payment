import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useEffect, useState } from 'react';

import atomLoader from '@/assets/atom-loader.json';


export const OrderSubmittedPopup = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';

    // Play a short, pleasant success chime
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(0.12, now + start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + duration);
        };

        playTone(523.25, 0, 0.18);     // C5
        playTone(659.25, 0.12, 0.22);  // E5
        playTone(783.99, 0.28, 0.38);  // G5

        setTimeout(() => ctx.close(), 800);
      }
    } catch {
      // Ignore audio errors to avoid breaking the UI
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-foreground/20 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={[
          'relative flex w-[min(92vw,22rem)] flex-col items-center rounded-2xl border border-border/60 bg-card/80 p-8 text-center shadow-2xl shadow-foreground/5 backdrop-blur-xl',
          'transition-all duration-500 ease-out',
          mounted ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.96] opacity-0',
        ].join(' ')}
      >
        <style>{`
          @keyframes os-ring {
            0% { transform: scale(0.8); opacity: 0.6; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes os-check {
            0% { stroke-dashoffset: 52; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes os-glow {
            0%, 100% { opacity: 0.35; transform: scale(1); }
            50% { opacity: 0.55; transform: scale(1.05); }
          }
          @keyframes os-dot-bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-4px); }
          }
          .os-ripple {
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            border: 1px solid hsl(var(--success) / 0.35);
            animation: os-ring 1.8s cubic-bezier(0.16,1,0.3,1) infinite;
          }
          .os-ripple:nth-child(2) { animation-delay: 0.6s; }
          .os-ripple:nth-child(3) { animation-delay: 1.2s; }
          .os-check {
            stroke-dasharray: 52;
            stroke-dashoffset: 52;
            animation: os-check 0.55s cubic-bezier(0.65,0,0.45,1) 0.25s forwards;
          }
          .os-glow {
            animation: os-glow 2.4s ease-in-out infinite;
          }
          .os-dot {
            animation: os-dot-bounce 1.2s ease-in-out infinite;
          }
          .os-dot:nth-child(2) { animation-delay: 0.15s; }
          .os-dot:nth-child(3) { animation-delay: 0.3s; }
        `}</style>

        <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-success/15 os-glow" />
          <div className="os-ripple" />
          <div className="os-ripple" />
          <div className="os-ripple" />
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-success shadow-xl shadow-success/30 ring-4 ring-success/20">
            <svg viewBox="0 0 52 52" className="h-10 w-10">
              <path
                className="os-check"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27l8 8 16-17"
              />
            </svg>
          </div>
        </div>

        <h2 className="mb-1.5 text-xl font-extrabold tracking-tight text-success">
          Order Submitted
        </h2>
        <p className="mb-4 text-sm font-bold text-muted-foreground">
          Redirecting to payment...
        </p>

        <div className="flex items-center justify-center gap-1.5">
          <span className="os-dot h-2 w-2 rounded-full bg-success" />
          <span className="os-dot h-2 w-2 rounded-full bg-success" />
          <span className="os-dot h-2 w-2 rounded-full bg-success" />
        </div>
      </div>
    </div>
  );
};

export const OrderProcessingPopup = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
      <style>{`
        @keyframes op-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .op-progress-bar { animation: op-bar 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes op-dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
        .op-dot { animation: op-dot 1.2s ease-in-out infinite; }
        .op-dot:nth-child(2) { animation-delay: 0.15s; }
        .op-dot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>
      <div
        className={[
          'relative flex w-[min(90vw,21rem)] flex-col items-center rounded-3xl border border-white/60 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-2xl',
          'transition-all duration-500 ease-out',
          mounted ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.96] opacity-0',
        ].join(' ')}
      >
        {/* subtle top accent line */}
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
          <DotLottieReact
            data={atomLoader}
            loop
            autoplay
            style={{ width: '85%', height: '85%' }}
          />
        </div>

        <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">
          Processing Order
        </h2>
        <p className="mb-5 text-[13px] font-medium text-muted-foreground">
          Please wait while we confirm your request
          <span className="inline-flex items-center gap-1 align-middle">
            <span className="op-dot ml-1 h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="op-dot h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="op-dot h-1 w-1 rounded-full bg-muted-foreground" />
          </span>
        </p>

        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="op-progress-bar h-full w-full rounded-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        </div>
      </div>
    </div>
  );
};
