# Responsive Card and OTP Screens

## Goal
Make the Card Payment form and Card OTP screen fit naturally within every phone, tablet, and desktop viewport without page scrolling, clipped content, or excessive empty space.

## Card Payment Form
- Replace the current fixed short-screen scaling workaround with height-aware spacing and sizing that uses the available viewport directly.
- Keep the card/Transaction Details area at a stable responsive height while compacting it only on short displays.
- Reserve space for the optional card information row beneath the card number so opening it never covers or pushes lower fields/actions outside the screen.
- Responsively tighten headings, brand marks, field gaps, input heights, buttons, and footer while keeping every control readable and visible.
- Preserve the animated card behavior, exact entered values, outside-click behavior, validation, and payment actions.

## Card OTP Screen
- Convert the OTP layout to a fixed-viewport, non-scrolling responsive arrangement.
- Scale the phone illustration, explanatory text, transaction details, OTP input, buttons, timeout text, and footer progressively for short screens.
- Use flexible spacing on tall screens so content remains balanced without large empty gaps.
- Keep the help dialog usable within short viewports.

## Verification
- Check the normal Transaction Details view, expanded card preview, populated card information row, and CVV back view.
- Check the OTP screen at representative short phone, tall phone, tablet, and desktop sizes.
- Confirm no vertical overflow, clipping, overlap, or hidden actions and confirm the preview build remains healthy.
