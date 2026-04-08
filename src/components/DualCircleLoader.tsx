import { useEffect } from "react";

import { cn } from "@/lib/utils";

type DualCircleLoaderProps = {
  spinnerClassName?: string;
};

const DualCircleLoader = ({ spinnerClassName }: DualCircleLoaderProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative w-10 h-10">
        {/* Outer circle */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-primary",
            spinnerClassName,
          )}
          style={{ animation: "spin-loader 0.8s linear infinite" }}
        />
        {/* Inner circle */}
        <div
          className={cn(
            "absolute inset-[6px] rounded-full border-[3px] border-transparent border-b-primary border-l-primary",
            spinnerClassName,
          )}
          style={{ animation: "spin-loader-reverse 0.6s linear infinite" }}
        />
      </div>
      <style>{`
        @keyframes spin-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-loader-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};

export default DualCircleLoader;
