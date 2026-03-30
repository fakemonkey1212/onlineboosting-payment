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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative w-8 h-8">
        <div
          className="absolute inset-0 rounded-full border-[4px] border-transparent"
          style={{
            borderTopColor: color,
            animation: "spinner-spin 0.8s linear infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes spinner-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StackedSpinnerLoader;
