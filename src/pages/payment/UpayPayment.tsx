import SafePaymentPage from "@/components/payment/SafePaymentPage";
import logo from "@/assets/payment/upay-logo-tight.png";

export default function UpayPayment() {
  return <SafePaymentPage method="upay" name="Upay" logo={logo} />;
}
