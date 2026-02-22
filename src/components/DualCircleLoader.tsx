const DualCircleLoader = () => {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-20 h-20">
        {/* Outer circle */}
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-b-primary"
          style={{ animation: "spin-right 1.2s linear infinite" }}
        />
        {/* Inner circle */}
        <div
          className="absolute inset-3 rounded-full border-4 border-transparent border-t-primary/60 border-b-primary/60"
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
