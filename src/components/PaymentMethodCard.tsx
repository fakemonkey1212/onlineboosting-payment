interface PaymentMethodCardProps {
  children: React.ReactNode;
}

const PaymentMethodCard = ({ children }: PaymentMethodCardProps) => {
  return (
    <div className="bg-card rounded-lg border border-border flex items-center justify-center h-[72px] cursor-pointer hover:shadow-sm transition-shadow">
      {children}
    </div>
  );
};

export default PaymentMethodCard;
