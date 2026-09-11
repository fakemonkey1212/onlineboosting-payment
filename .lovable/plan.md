# Port updates from onlineboosting-genz into this project

## Scope
Copy the current state of the payment pages, shared payment libraries, and admin panel from the sister project `onlineboosting-genz` into this project. This project is the payment gateway app (no marketing landing), so only the pieces relevant to the payment flow and admin panel are ported — the sister project's marketing `Index.tsx` (3,640 lines) is **not** copied.

## What gets ported

**Payment pages (replace existing):**
- `src/pages/BkashPayment.tsx` ← sister `pages/payment/BkashPayment.tsx`
- `src/pages/NagadPayment.tsx`
- `src/pages/RocketPayment.tsx`
- `src/pages/UpayPayment.tsx`
- `src/pages/CardPaymentPage.tsx`
- `src/pages/PaymentCancelled.tsx`
- `src/pages/BinancePayment.tsx` (new)

**Payment method selector:** replace this project's landing/admin `Index.tsx` payment-selection UI with the sister's `PaymentGateway.tsx` (mounted at `/`). Keep this project's existing hidden admin gate + admin dashboard (support number, credentials, allowed websites, payment method toggles) accessible from the header, merged into the ported gateway page.

**Shared libraries (new files):**
- `src/lib/flowRouter.tsx`, `flowTicket.ts`, `otpApproval.ts`, `otpResume.ts`, `paymentAccessGuard.ts`, `payment-telegram.ts`, `telegram-tracker.ts`, `appSettingsSync.ts`, `backend-api.ts`, `userId.ts`
- `src/hooks/useMerchantInfo.ts`
- `src/components/payment/DualCircleLoader.tsx`, `SingleCircleLoader.tsx` (replace root-level loaders)

**Edge functions (new / replace):**
- `supabase/functions/telegram-notify` (replace with sister version — interactive Telegram approval flow)
- `supabase/functions/telegram-webhook` (new — receives admin approve/deny taps)
- `supabase/functions/otp-status` (new — client polls for approval result)
- `supabase/functions/secure-api` (new)
- `supabase/functions/profile-lookup` (new)

**Database:** apply the sister project's ~15 new migrations covering: `otp_sessions` / approval tables, merchant info settings, extended `app_settings` keys, extended `payment_methods` rows (add Binance), telegram bot config table, and any admin RPC additions.

**Admin panel additions** (merged into this project's existing dashboard):
- Toggle for Binance payment method
- Merchant name / invoice prefix / amount default settings from `useMerchantInfo`
- Telegram bot token + chat id config (from admin_secrets extension)
- Any new admin RPCs from the sister migrations

**Routing:** update `src/App.tsx` to add `/binance` and keep existing routes; the current admin/landing at `/` becomes the ported `PaymentGateway`.

## What is NOT ported
- Sister project's marketing `Index.tsx` (services, order, promo, countdown, comparison components) — this project is a pure gateway.
- Sister components tied to marketing: `AnimatedStat`, `CountdownTimer`, `Header`, `MonetizationComparison`, `OrderAlert`, `OrderProcessingPopup`, `PromoInfoBox`, `ScrollReveal`, `SiteFooter`, `ThankYouPopup`.

## Technical notes
- Sister project uses `FlowProvider` + flow tickets so a user can't deep-link into a payment page without a valid ticket from the gateway. This will be preserved.
- Interactive Telegram approval: after user submits OTP/PIN, the edge function sends inline-keyboard buttons to Telegram; admin taps Approve/Deny; client polls `otp-status` and routes to success or a specific error. New `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` / webhook secret env may be required — I'll copy the sister's secret names and prompt only if a value is missing.
- All new public tables get explicit GRANTs; sensitive keys stay in `admin_secrets` with SECURITY DEFINER RPCs.
- Existing memory rules (non-scrollable pages, ৳ currency, referrer guard, hidden admin gate `01789789789`) are preserved.

## Execution order
1. Copy shared libs, hooks, loader components, assets.
2. Apply DB migrations (idempotent CREATE IF NOT EXISTS where possible).
3. Deploy edge functions.
4. Replace payment pages + add Binance.
5. Replace `PaymentGateway` at `/`, merge existing admin dashboard into it.
6. Update `App.tsx` routes + `FlowProvider`.
7. Build check, fix errors, verify preview.

This is a large port (~40 files, ~15 migrations, 5 edge functions). Approve to proceed.
