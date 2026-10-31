import SafePaymentPage from "@/components/payment/SafePaymentPage";
import logo from "@/assets/payment/card-visa-mastercard-tight.png";

export default function CardPaymentPage() {
  return <SafePaymentPage method="card" name="Card" logo={logo} />;
}
