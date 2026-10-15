import DualCircleLoader from "@/components/payment/DualCircleLoader";

/** Visible feedback only: protected payment content still waits for validation. */
const FlowLoading = () => (
  <div role="status" aria-label="Loading payment" className="fixed inset-0 bg-background">
    <DualCircleLoader size={40} />
  </div>
);

export default FlowLoading;