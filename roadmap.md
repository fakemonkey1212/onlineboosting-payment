# Loading and payment selection
- [x] Remove bKash2 choices, admin control, route registration, and dedicated asset.
- [x] Verify old bKash2 links cancel; method-removal test and display tests passed.
- [ ] Remove its saved payment-method record — blocked because database changes are disabled by the user's tool preference.
- [x] Show a visible loading state during server access checks.
- [x] Refresh public admin display settings before opening payment pages.
- [x] Animate payment-method selection smoothly, then show the loader immediately.
- [x] Verify loading and animation behavior (two unit tests and controlled browser checks passed; preview build OK).