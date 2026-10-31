import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "@/lib/flowRouter";
import { usePaymentMethodGuard } from "@/hooks/usePaymentMethodGuard";
import FlowLoading from "@/components/FlowLoading";

export default function SafePaymentPage({ method, name, logo }: { method: string; name: string; logo: string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const allowed = usePaymentMethodGuard(method);
  const amount = params.get("amount") || "00";
  if (allowed !== true) return <FlowLoading />;

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-6 overflow-hidden bg-background px-5 py-8 text-foreground">
      <img src={logo} alt={name} width={160} height={64} className="h-16 w-40 object-contain" />
      <h1 className="text-center text-xl font-semibold">{name} payment unavailable</h1>
      <p className="text-center text-lg font-semibold">{amount} {method === "card" ? "BDT" : "৳"}</p>
      <p className="max-w-sm text-center text-sm text-muted-foreground" role="status">
        An official payment provider has not been connected. No payment has been taken.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => navigate("/payment")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Button variant="destructive" onClick={() => navigate(`/payment-cancelled?reason=${encodeURIComponent("Payment provider not connected")}`)}><X className="mr-2 h-4 w-4" />Cancel payment</Button>
      </div>
    </main>
  );
}
