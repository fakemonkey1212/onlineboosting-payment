import { useEffect, useState } from "react";
import { RotateCcw, ShoppingBag } from "lucide-react";
import ProcessingScreen, { PROCESSING_DURATION_MS } from "@/components/ProcessingScreen";
import DualCircleLoader from "@/components/payment/DualCircleLoader";
import { Button } from "@/components/ui/button";

// This isolated preview has no payment inputs, session access, or submissions.
const LoaderDemo = () => {
  const [stage, setStage] = useState<"processing" | "circular" | "ready">("processing");

  useEffect(() => {
    const processing = window.setTimeout(() => setStage("circular"), PROCESSING_DURATION_MS);
    const circular = window.setTimeout(() => setStage("ready"), PROCESSING_DURATION_MS + 1200);
    return () => {
      window.clearTimeout(processing);
      window.clearTimeout(circular);
    };
  }, []);

  if (stage === "processing") return <ProcessingScreen />;

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background p-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground">
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /><h1 className="text-lg font-semibold">Sample Merchant</h1></div>
          <span className="text-xs text-muted-foreground">DEMO ONLY</span>
        </header>
        <dl className="my-8 flex items-center justify-between"><dt className="text-muted-foreground">Sample amount</dt><dd className="text-2xl font-semibold">৳10.34</dd></dl>
        <Button className="w-full" onClick={() => window.location.reload()} disabled={stage !== "ready"}>
          <RotateCcw /> Replay
        </Button>
      </section>
      {stage === "circular" && <div role="status" aria-label="Loading sample payment page"><DualCircleLoader size={47} /></div>}
    </main>
  );
};

export default LoaderDemo;