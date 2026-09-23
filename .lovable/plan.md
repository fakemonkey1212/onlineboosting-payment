# Secure one-time payment tokens

## What changes for visitors
- Arriving from an allowed website creates a brand-new payment session on the server. The address bar then shows only `/p/<25-char token>`. It never shows the amount, payment method, referrer or order number.
- Every page in the flow (main payment page, bKash, Nagad, Rocket, Upay, Card, Binance) checks the token with the server before it shows anything.
- If a token is invalid, expired or already used, the visitor goes to the cancellation page. An old link can't restart a payment.
- A token expires after 30 minutes. It is used up when the flow finishes, whether it ends in success, a failure or a cancellation.

## Flow
```text
Allowed site --> /?amount=125 (first entry)
   -> server: create session (referrer, amount, order ID, IP/UA hash) -> token
   -> redirect to /p/<token>                (amount stripped from the URL)
Select method -> server binds platform to the token -> /p/<token>/bkash
Each page load / OTP / PIN step -> server validates the token
Completion or cancel -> server marks the token used -> /payment-cancelled
```

## Technical details
- New private table `payment_sessions` stores: token (unique), order_id, amount, referrer, platform, client fingerprint hash, status (active/used/revoked), expires_at, created_at and used_at. RLS is on, with no public access. Only the edge function can reach it.
- A new edge function, `flow-session`, handles four actions:
  - `start`: checks the referrer against the allowed websites, then creates the token with `crypto.getRandomValues`. The token is 25 characters from a 62-character alphabet, chosen without bias, and retried if it ever collides.
  - `bind`: sets the platform, only once.
  - `validate`: returns the amount, platform and merchant info only if the token is active, unexpired and matches this browser.
  - `complete`: marks the token used.
- On the website side:
  - Routes become `/p/:token` and `/p/:token/:method`.
  - The current local ticket in the browser is replaced by server validation.
  - The amount comes from the server, not the URL.
  - The old `?amount=` query is removed from all internal links.
- The existing Telegram and OTP functions will receive the token and check it on the server before they send alerts or record decisions.
- Old direct routes like `/bkash` redirect to the cancellation page.

## Verification
- Two starts with the same amount and referrer give different tokens.
- Reusing a link after completion goes to the cancellation page.
- A tampered or expired token goes to the cancellation page.
- The full bKash flow still works end to end.
