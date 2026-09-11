# Simplify the payment gateway and fix method controls

## Scope
- Remove promo-code controls, settings, URL forwarding, and unused order/referral-only code copied from the previous website.
- Remove the order-processing behavior from the payment-cancelled screen while preserving payment failure details and payment/OTP notifications.
- Fix payment-method loading so the enabled methods returned by the backend are interpreted correctly on the gateway and individual payment pages.
- Keep each admin switch independent and synchronize its saved state without turning unrelated methods off.
- Prevent horizontal scrolling globally and constrain the payment screens to the visible viewport.

## Technical details
- Normalize the enabled-payment response into method IDs, whether the backend returns IDs or enabled method records.
- Remove the promo state, backend reads/writes, admin panel section, and `promo` query propagation from all payment navigation.
- Delete files and dependencies that become unused after removing order/promo behavior.
- Add global `overflow-x: hidden`, width constraints, and verify the main gateway at mobile width.

## Verification
- Run focused tests/build checks.
- Open the mobile preview, confirm no horizontal overflow, and verify enabled payment cards remain enabled after navigation.
