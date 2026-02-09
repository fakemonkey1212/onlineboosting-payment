import { Home, Upload, X, Headphones, HelpCircle, Gift, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";
import rocketLogo from "@/assets/rocket-logo.png";
import upayLogo from "@/assets/upay-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import mastercardLogo from "@/assets/mastercard-logo.png";
import troyLogo from "@/assets/troy-logo.png";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex items-start md:items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="w-full max-w-[520px] md:max-w-[700px] lg:max-w-[800px] flex flex-col h-full md:max-h-[720px]">
        {/* Card - white on desktop, transparent on mobile */}
        <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex flex-col">
          {/* Top Bar - All icons in one white box */}
          <div className="flex items-center justify-center px-3 py-2 md:px-5 md:py-3">
            <div className="bg-card rounded-lg flex items-center justify-between w-full px-4 py-2 shadow-sm">
              <Home className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-foreground" strokeWidth={1.5} />
                <X className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-3 md:px-6 pb-16 md:pb-6 flex flex-col">
            {/* GenZ Logo */}
            <div className="flex justify-center mt-1 mb-2">
              <img 
                src={genzLogo} 
                alt="GenZ" 
                className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover"
              />
            </div>

            {/* Title Section */}
            <div className="text-center mb-2">
              <h1 className="text-foreground text-base md:text-xl font-bold mb-0.5">
                GenZ SMM
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-normal">
                Online Payment
              </p>
            </div>

            {/* Icon Row */}
            <div className="flex justify-center gap-4 md:gap-8 mb-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Headphones className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">Support</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">FAQ</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 relative">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[8px] rounded-full flex items-center justify-center font-medium">2</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">Offers</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <LogIn className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">Login</span>
              </div>
            </div>

            {/* Mobile Banking Button */}
            <button className="w-full bg-primary text-primary-foreground py-2 md:py-2.5 rounded-lg font-medium text-sm mb-3 tracking-wide">
              মোবাইল ব্যাংকিং
            </button>

            {/* Payment Methods Grid - 2 cols mobile transparent, 3 cols desktop/tablet */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
              <div 
                onClick={() => navigate("/bkash")}
                className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[70px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow"
              >
                <img src={bkashLogo} alt="bKash" className="h-10 md:h-12 object-contain" />
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[70px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={nagadLogo} alt="Nagad" className="h-10 md:h-12 object-contain" />
              </div>
              <div className="relative bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[70px] md:h-20 cursor-not-allowed">
                <img src={rocketLogo} alt="Rocket" className="h-10 md:h-12 object-contain opacity-50" />
                <div className="absolute top-1 right-1 bg-black/70 text-white text-[6px] md:text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  Unavailable
                </div>
              </div>
              <div className="relative bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[70px] md:h-20 cursor-not-allowed">
                <img src={upayLogo} alt="Upay" className="h-10 md:h-12 object-contain opacity-50" />
                <div className="absolute top-1 right-1 bg-black/70 text-white text-[6px] md:text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  Unavailable
                </div>
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[70px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={visaLogo} alt="VISA" className="h-8 md:h-10 object-contain" />
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[70px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={mastercardLogo} alt="Mastercard" className="h-10 md:h-12 object-contain" />
              </div>
              <div className="relative bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[70px] md:h-20 cursor-not-allowed">
                <img src={troyLogo} alt="Troy" className="h-8 md:h-10 object-contain opacity-50" />
                <div className="absolute top-1 right-1 bg-black/70 text-white text-[6px] md:text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  Unavailable
                </div>
              </div>
            </div>
          </div>

          {/* Pay Footer - Desktop/Tablet only (inside box) */}
          <div className="hidden md:block bg-pay-bar py-3 text-center rounded-b-2xl mt-auto">
            <span className="text-primary font-bold text-lg">Pay 434 BDT</span>
          </div>
        </div>

        {/* Pay Footer - Mobile only (fixed bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-pay-bar py-3 text-center">
          <span className="text-primary font-bold text-base">Pay 434 BDT</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
