# Main payment page loader sequence

## Changes
- Keep the existing “Processing Your Payment” screen for a fresh payment flow.
- Show the existing blue circular loader immediately after that screen finishes.
- When returning from any selected payment method, skip the processing screen but show the blue loader every time.
- Remove the blur from the blue loader overlay on the main payment page while retaining a light translucent background.

## Verification
- Confirm the project builds successfully.
- Verify fresh entry shows processing, then blue loader, then the main page.
- Verify returning from a payment method shows the blue loader before the main page.
