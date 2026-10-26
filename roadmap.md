# Loading and payment selection
- [ ] Reduce redundant public requests and verify checkout navigation, realtime availability updates, and rate-limit handling.
- [x] Fix payment API CORS; browser verified authorized checkout, exact amount, bKash navigation, zero CORS errors, and untrusted-entry cancellation; admin cookie transport unchanged.
- [x] Remove bKash2 choices, admin control, route registration, and dedicated asset.
- [x] Verify old bKash2 links cancel; method-removal test and display tests passed.
- [ ] Remove its saved payment-method record — blocked because database changes are disabled by the user's tool preference.
- [x] Show a visible loading state during server access checks.
- [x] Refresh public admin display settings before opening payment pages.
- [x] Animate payment-method selection smoothly, then show the loader immediately.
- [x] Verify loading and animation behavior (two unit tests and controlled browser checks passed; preview build OK).