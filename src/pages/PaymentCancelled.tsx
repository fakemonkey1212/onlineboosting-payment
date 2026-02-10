import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(7);

  const channel = searchParams.get("channel") || "GenZ Direct Debit";
  const reason = searchParams.get("reason") || "Method not Selected";
  const amount = searchParams.get("amount") || "434.00";
  const refId = searchParams.get("ref") || "—";

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[600px] bg-card rounded-lg shadow-sm overflow-hidden">
        {/* Top Section */}
        <div className="px-6 py-8 text-center space-y-6">
          <div>
            <h1 className="text-foreground text-xl md:text-2xl font-bold">
              Redirecting to the Merchant Site
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              This may take a few seconds
            </p>
          </div>

          <div>
            <h2 className="text-foreground text-lg md:text-xl font-bold">
              Sorry for your order
            </h2>
          </div>

          <div>
            <p className="text-foreground text-sm md:text-base">
              Your payment of <span className="font-bold">{amount}</span> BDT is{" "}
              <span className="text-destructive font-bold">
                FAILED (Merchant Verification Failed)
              </span>
              .
            </p>
            <p className="text-foreground text-sm md:text-base">
              payment ref id {refId}
            </p>
          </div>
        </div>

        {/* Middle Section */}
        <div className="border-t border-b border-border px-6 py-6 text-center space-y-3">
          <p className="text-foreground text-sm md:text-base">
            Payment Channel - <span className="font-bold">{channel}</span>
          </p>
          <p className="text-foreground text-sm md:text-base">
            Reason for Declined - <span className="font-bold">{reason}</span>
          </p>

          <div className="pt-2 space-y-1">
            <p className="text-sm md:text-base">
              <span
                onClick={() => navigate("/")}
                className="text-primary font-bold underline cursor-pointer hover:opacity-80"
              >
                Re-try
              </span>{" "}
              <span className="text-foreground">to pay by another payment channel</span>
            </p>
            <p className="text-sm md:text-base">
              <span
                onClick={() => navigate("/")}
                className="text-primary font-bold underline cursor-pointer hover:opacity-80"
              >
                Try later
              </span>{" "}
              <span className="text-foreground">to pay and return to merchant</span>
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="px-6 py-5 bg-muted/30 text-center">
          <p className="text-muted-foreground text-xs md:text-sm">
            You're now going back to the merchant site.
          </p>
          <p className="text-muted-foreground text-xs md:text-sm">
            If you are not redirected within{" "}
            <span className="font-bold text-foreground">{countdown}</span> seconds,{" "}
            <span
              onClick={() => navigate("/")}
              className="text-primary font-bold underline cursor-pointer hover:opacity-80"
            >
              click here...
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
