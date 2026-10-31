import SafePaymentPage from "@/components/payment/SafePaymentPage";
import logo from "@/assets/payment/rocket-logo-tight.png";

export default function RocketPayment() {
  return <SafePaymentPage method="rocket" name="Rocket" logo={logo} />;
}
