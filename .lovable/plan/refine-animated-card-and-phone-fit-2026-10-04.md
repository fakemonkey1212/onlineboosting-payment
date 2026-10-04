# Refine animated card and phone fit

## What will change
- Replace the chip’s current top-left position with a compact issuing-bank identity mark based on detected card details.
- Restyle the chip with a polished gold finish and place it directly beneath the card number.
- Move the cardholder name and expiry line slightly lower while keeping all live card updates and the CVV flip unchanged.
- Tighten vertical spacing and control heights progressively on shorter phone screens so the full card-payment page fits without scrolling.
- Preserve readable sizes, balanced gaps, current validation, payment actions, and desktop appearance.

## Technical details
- Reuse the existing BIN issuer data for the bank mark, with a neutral bank emblem while issuer data is loading or unavailable.
- Add semantic chip colors to the existing design tokens.
- Use viewport-height responsive styles rather than a fixed scale, keeping controls usable and avoiding excess empty space.
- Verify the front card, CVV back, and complete page at representative short and tall phone sizes.
