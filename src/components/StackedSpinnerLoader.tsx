import { useEffect } from "react";

interface StackedSpinnerLoaderProps {
  color?: string;
}

const StackedSpinnerLoader = ({ color = "#2d7dd2" }: StackedSpinnerLoaderProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        {/* Three stacked spinning rings */}
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent"
            style={{
              borderTopColor: color,
              borderBottomColor: color,
              animation: "stacked-spin-1 1.4s linear infinite",
            }}
          />
          <div
            className="absolute inset-[6px] rounded-full border-[3px] border-transparent"
            style={{
              borderLeftColor: color,
              borderRightColor: color,
              animation: "stacked-spin-2 1.0s linear infinite",
            }}
          />
          <div
            className="absolute inset-[12px] rounded-full border-[3px] border-transparent"
            style={{
              borderTopColor: color,
              borderBottomColor: color,
              animation: "stacked-spin-3 0.7s linear infinite",
            }}
          />
        </div>
        <p className="text-white text-sm font-medium mt-2 animate-pulse">Processing...</p>
      </div>

      <style>{`
        @keyframes stacked-spin-1 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes stacked-spin-2 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes stacked-spin-3 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StackedSpinnerLoader;
