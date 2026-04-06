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
      <div
        className={cn(
          "h-6 w-6 rounded-full border-[3.5px] border-transparent border-r-current border-t-current text-primary",
          spinnerClassName,
        )}
        style={{ animation: "spin-loader 0.6s linear infinite" }}
      />
      <style>{`
        @keyframes spin-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DualCircleLoader;
