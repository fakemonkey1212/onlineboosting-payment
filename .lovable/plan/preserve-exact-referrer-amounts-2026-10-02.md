# Preserve exact referrer amounts

## Changes
- Accept a valid decimal amount from the trusted referrer without converting it to an integer.
- Store the validated amount as text in the protected payment session so its original decimal digits are preserved.
- Return and display that exact value across the payment chooser, all payment methods, notifications, and cancellation page.
- Remove card-specific formatting that currently forces two decimal places.
- Keep Binance’s USDT conversion calculated from the amount while showing the original BDT amount exactly as received.

## Validation
- Verify an amount such as `10.34` remains `10.34` end-to-end.
- Check the preview build after the frontend and backend updates.
