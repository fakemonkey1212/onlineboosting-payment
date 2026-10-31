# Safe payment connection
- [x] Remove payment credential capture, Telegram forwarding and approval/resume code; purge legacy browser credential storage.
- [x] Delete deployed Telegram/OTP endpoints and remove admin controls; deploy retained functions.
- [x] Add bounded Cloudflare API forwarding and allow HTTPS genzsmm.com subdomains without changing authorization; five proxy/origin tests passed.
- [x] Verify 24 regression tests, preview build OK and authorized amount entry → bKash → Back → Card → cancellation, with no credential inputs or retired-endpoint calls.
- [ ] Verify live Cloudflare forwarding — requires rebuilding Cloudflare with the updated repository; no Cloudflare deployment access here.
- [ ] Enable real payment processing — requires an official payment-provider merchant integration; no provider credentials or checkout integration supplied.

# Existing blocker
- [ ] Remove saved bKash2 record — database deletion previously declined.

