import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

interface ThankYouPopupProps {
  onClose?: () => void;
}

export const ThankYouPopup = ({ onClose }: ThankYouPopupProps) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm w-[90%] sm:w-full text-center animate-in slide-in-from-bottom duration-300 shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your order has been submitted successfully. Redirecting to payment...
        </p>
      </div>
    </div>
  );
};
