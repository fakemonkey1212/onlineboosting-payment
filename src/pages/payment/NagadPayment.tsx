import SafePaymentPage from "@/components/payment/SafePaymentPage";
import logo from "@/assets/payment/nagad-logo-tight.png";

export default function NagadPayment() {
  return <SafePaymentPage method="nagad" name="Nagad" logo={logo} />;
}
