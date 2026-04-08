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
      <div className="relative w-12 h-12">
        {/* Outer circle */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[4px] border-transparent border-t-primary border-r-primary",
            spinnerClassName,
          )}
          style={{ animation: "spin-loader 1.2s linear infinite" }}
        />
        {/* Inner circle */}
        <div
          className={cn(
            "absolute inset-[7px] rounded-full border-[4px] border-transparent border-b-primary border-l-primary",
            spinnerClassName,
          )}
          style={{ animation: "spin-loader-reverse 0.9s linear infinite" }}
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
