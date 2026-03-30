import { useEffect } from "react";

const DualCircleLoader = () => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-[3.5px] border-transparent border-t-[#2d7dd2] border-r-[#2d7dd2]"
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
