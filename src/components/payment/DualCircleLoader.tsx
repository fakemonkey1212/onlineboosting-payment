import { useEffect } from "react";
import { cn } from "@/lib/utils";

type DualCircleLoaderProps = {
  spinnerClassName?: string;
  size?: number;
  transparentBg?: boolean;
};

const DualCircleLoader = ({ spinnerClassName, size = 40, transparentBg = false }: DualCircleLoaderProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[3px] ${transparentBg ? 'bg-white/30' : 'bg-black/5'}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[5px] border-transparent border-t-[#2196F3] border-b-[#2196F3]",
            spinnerClassName,
          )}
          style={{ animation: "spin-loader 0.9s linear infinite" }}
        />
        <div
          className={cn(
            "absolute inset-[7px] rounded-full border-[5px] border-transparent border-t-[#2196F3] border-b-[#2196F3]",
            spinnerClassName,
          )}
          style={{ animation: "spin-loader-reverse 0.7s linear infinite" }}
        />
      </div>
      <style>{`
        @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes spin-loader-reverse { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
};

export default DualCircleLoader;
