import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface CancelPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCancel: () => void;
}

const CancelPaymentDialog = ({ open, onOpenChange, onConfirmCancel }: CancelPaymentDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl border-none shadow-2xl bg-white p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 text-center">
          <AlertDialogTitle className="text-white text-lg font-bold">
            ⚠️ Are you sure you want to cancel this payment?
          </AlertDialogTitle>
        </div>

        {/* Bangla Message */}
        <div className="px-6 py-5">
          <AlertDialogDescription asChild>
            <p className="text-gray-800 text-[15px] leading-relaxed font-medium text-center" style={{ fontFamily: "'Noto Sans Bengali', 'Kalpurush', sans-serif" }}>
              আপনি ১ দিনে সর্বোচ্চ ২ বার অর্ডার করতে পারবেন। আপনি যদি পেমেন্ট টি এখন ক্যানসেল করেন তাহলে আর একবার ই করার সুযোগ পাবেন। আপনি কি এখন পেমেন্ট টি ক্যানসেল করতে চাচ্ছেন?
            </p>
          </AlertDialogDescription>
        </div>

        {/* Buttons */}
        <AlertDialogFooter className="flex flex-col gap-3 px-6 pb-6 sm:flex-col sm:space-x-0">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="w-full py-3 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 border-none transition-colors order-1"
          >
            No, Continue Payment
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmCancel}
            className="w-full py-3 rounded-xl text-sm font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 border-none transition-colors order-2"
          >
            Yes, Cancel Payment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelPaymentDialog;
