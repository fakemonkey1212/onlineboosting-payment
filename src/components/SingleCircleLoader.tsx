import { useEffect } from "react";

type SingleCircleLoaderProps = {
  size?: number;
  color?: string;
};

const SingleCircleLoader = ({ size = 32, color = "#C41E3A" }: SingleCircleLoaderProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="rounded-full border-[5px] border-transparent"
        style={{
          width: size,
          height: size,
          borderTopColor: color,
          borderRightColor: color,
          borderBottomColor: color,
          animation: "spin-single-loader 0.9s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin-single-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SingleCircleLoader;
