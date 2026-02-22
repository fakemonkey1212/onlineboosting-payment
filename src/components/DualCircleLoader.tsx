const DualCircleLoader = () => {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-10 h-10">
        {/* Outer circle */}
        <div
          className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-[#2d7dd2] border-b-[#2d7dd2]"
          style={{ animation: "spin-right 1.2s linear infinite" }}
        />
        {/* Inner circle */}
        <div
          className="absolute inset-1.5 rounded-full border-[4px] border-transparent border-t-[#2d7dd2] border-b-[#2d7dd2]"
          style={{ animation: "spin-left 0.9s linear infinite" }}
        />
      </div>

      <style>{`
        @keyframes spin-right {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-left {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};

export default DualCircleLoader;
