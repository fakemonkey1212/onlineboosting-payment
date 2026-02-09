import { Home, Upload, X } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import mastercardLogo from "@/assets/mastercard-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] flex flex-col min-h-[85vh]">
        {/* White Card */}
        <div className="bg-card rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-4">
            <Home className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            <div className="flex items-center gap-4">
              <Upload className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              <X className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 pb-6">
            {/* GenZ Logo */}
            <div className="flex justify-center mt-4 mb-4">
              <img 
                src={genzLogo} 
                alt="GenZ" 
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>

            {/* Title */}
            <h1 className="text-center text-muted-foreground text-xl font-normal mb-6">
              Online Payment
            </h1>

            {/* Mobile Banking Button */}
            <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-base mb-6">
              মোবাইল ব্যাংকিং
            </button>

            {/* Payment Methods Grid - 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[80px] cursor-pointer hover:shadow-sm transition-shadow">
                <img src={bkashLogo} alt="bKash" className="h-10 object-contain" />
              </div>
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[80px] cursor-pointer hover:shadow-sm transition-shadow">
                <img src={nagadLogo} alt="Nagad" className="h-10 object-contain" />
              </div>
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[80px] cursor-pointer hover:shadow-sm transition-shadow">
                <img src={visaLogo} alt="VISA" className="h-8 object-contain" />
              </div>
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[80px] cursor-pointer hover:shadow-sm transition-shadow">
                <img src={mastercardLogo} alt="Mastercard" className="h-10 object-contain" />
              </div>
            </div>
          </div>

          {/* Pay Footer */}
          <div className="bg-[hsl(var(--pay-bar))] py-4 text-center">
            <span className="text-primary font-bold text-lg">Pay 434 BDT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
