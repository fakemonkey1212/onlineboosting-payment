# Show the blue loader once per payment flow

## Changes
- Show the existing blue circular loader when the main payment page first opens.
- Remember that it was shown for the current secure payment token.
- Skip it when returning from a selected payment method, while showing it again for a genuinely new payment flow.

## Verification
- Confirm the project builds successfully.
- Verify first entry shows the loader and a return to the same payment page does not.
