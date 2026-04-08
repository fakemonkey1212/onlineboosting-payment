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
        {/* Outer circle - half arc */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[5px] border-transparent border-t-[#2196F3] border-b-[#2196F3]",
            spinnerClassName,
          )}
          style={{ animation: "spin-loader 0.8s linear infinite" }}
        />
        {/* Inner circle - half arc */}
        <div
          className={cn(
            "absolute inset-[7px] rounded-full border-[5px] border-transparent border-t-[#2196F3] border-b-[#2196F3]",
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
