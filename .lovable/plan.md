

## Dynamic Payment Amount

### Problem
The amount "434 BDT" is hardcoded across all pages (Index, BkashPayment, NagadPayment, VisaPayment, MastercardPayment, PaymentCancelled). The user wants visitors to arrive with a custom amount via URL (e.g., `/?amount=500`) and have that amount persist across all pages.

### Approach

1. **Read amount from URL query parameter on Index page** - Parse `?amount=XXX` from the URL. Default to 434 if not provided.

2. **Pass amount through navigation** - When navigating to payment pages (e.g., `/bkash?amount=500`), include the amount as a query parameter.

3. **Update all pages to use dynamic amount**:
   - **Index.tsx** - Replace hardcoded "434" in the Pay footer with the dynamic amount
   - **BkashPayment.tsx** - Replace all "434" references (display and cancelled navigation URLs)
   - **NagadPayment.tsx** - Replace "BDT 434" and cancelled URLs
   - **VisaPayment.tsx** - Replace "৳434" in buttons and cancelled URLs
   - **MastercardPayment.tsx** - Replace "৳434" in buttons and cancelled URLs
   - **PaymentCancelled.tsx** - Already reads amount from URL params, so no change needed

### Files to modify
- `src/pages/Index.tsx` - Read `?amount=` param, display it, pass to payment routes
- `src/pages/BkashPayment.tsx` - Read `?amount=` param, use throughout
- `src/pages/NagadPayment.tsx` - Same
- `src/pages/VisaPayment.tsx` - Same
- `src/pages/MastercardPayment.tsx` - Same

Each page will use `useSearchParams()` to read the amount and replace all hardcoded "434" values with the dynamic value.

