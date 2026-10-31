import SafePaymentPage from "@/components/payment/SafePaymentPage";
import logo from "@/assets/payment/bkash-logo-tight.png";

export default function BkashPayment() {
  return <SafePaymentPage method="bkash" name="bKash" logo={logo} />;
}
