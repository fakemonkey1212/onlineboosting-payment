# Loading and payment selection
- [x] Show a visible loading state during server access checks.
- [x] Refresh public admin display settings before opening payment pages.
- [x] Animate payment-method selection smoothly, then show the loader immediately.
- [x] Verify loading and animation behavior (two unit tests and controlled browser checks passed; preview build OK).

# Removing payment credential collection
- [x] Replace the bKash / Nagad / Rocket / Upay / Card / Binance screens with a guarded "checkout not configured" notice.
- [x] Delete the Telegram and code-approval pipeline (client libraries, admin settings, deployed functions).
- [x] Stop keeping code-entry state in the browser and wipe leftovers on visit.
- [x] Verify live: an approved referring site opens bKash with no input fields, and Cancel keeps the exact 10.34 amount.
- [ ] Connect a real payment service so payments can actually be taken (needs the owner's choice and account credentials).