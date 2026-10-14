# Remove credential collection

Stop the site from capturing bKash / Nagad / Rocket / Upay PINs & OTPs and card CVVs, and stop forwarding anything about a payment to Telegram. Keep the rest of the site (routing, admin panel, cancel page, flow sessions, UI shell) intact so you can later wire it to a real payment provider.

## What changes

1. **Payment pages (bKash, Nagad, Rocket, Upay, Card, Binance)**
   - Replace the PIN / OTP / CVV / card-number / mobile-number input screens with a single notice: "This checkout is not configured. No payment can be taken." with a Cancel button that returns to the referrer.
   - Delete all client code that reads those fields, posts them anywhere, or stores them.

2. **Telegram pipeline — fully removed**
   - Delete edge functions: `telegram-notify`, `telegram-webhook`.
   - Delete `_shared/telegramConfig.ts`.
   - Remove every `telegram-notify` invoke from the client.
   - Remove Telegram settings UI + fields from the Admin Panel.
   - Drop Telegram-related DB rows/columns (`telegram_settings`, `telegram_bot_token`, `telegram_chat_id`, etc.) via a migration.

3. **`secure-api` and `otp-status` edge functions**
   - Remove the PIN / OTP / card-detail submission and status endpoints.
   - Keep only session lookup used by Cancel and the shell.

4. **Admin Panel**
   - Remove the "Submissions / Logs" view that displayed captured PINs/OTPs/cards.
   - Remove the Telegram settings tab.
   - Keep: login, Allowed Websites, Payment Methods on/off, support number.

5. **Flow sessions, Cancel, referrer validation, routing** — unchanged.

## Not included
- No new real payment provider integration in this change. The payment pages will show the "not configured" notice until you ask for a provider (bKash/SSLCommerz/Stripe) to be wired in.

## Files touched (high level)
- Delete: `supabase/functions/telegram-notify`, `supabase/functions/telegram-webhook`, `supabase/functions/_shared/telegramConfig.ts`, `supabase/functions/secure-api` (or trim), `supabase/functions/otp-status`.
- Rewrite: `src/pages/payment/{BkashPayment,NagadPayment,RocketPayment,UpayPayment,CardPaymentPage,BinancePayment}.tsx` → thin "not configured" screen reusing existing header/background.
- Edit: Admin Panel pages to drop Telegram + Submissions tabs.
- Migration: drop telegram settings table/columns and any `submissions` / `pin_logs` / `otp_logs` tables.

## Verification
- Build passes.
- Opening a valid checkout URL shows the "not configured" notice, no inputs.
- No network call to `telegram-notify` or `secure-api` submission endpoints anywhere in the client.
- Admin Panel has no Telegram tab and no captured-credential view.
