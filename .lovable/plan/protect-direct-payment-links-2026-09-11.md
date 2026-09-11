# Protect direct payment links

## Changes
- Bind each temporary payment-flow pass to the exact payment method selected on the main payment page.
- Consume that pass when the selected payment page opens, preventing reused or manually opened direct links.
- Redirect every payment page opened without its matching pass to the payment-cancelled page while preserving the amount.
- Keep same-tab OTP recovery working for an already-started payment.

## Verification
- Confirm a direct `/bkash?amount=21` visit reaches the cancellation page.
- Confirm selecting bKash from an allowed main payment page still enters the bKash flow.
- Confirm all other payment methods use the same protection.
