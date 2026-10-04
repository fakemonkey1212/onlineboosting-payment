# Animated transaction card

## What will change
- Keep the selected Transaction Details panel unchanged whenever no card field is active.
- When Card Number, Card Holder Name, either Expiration Date selector, or CVV receives focus, animate the panel into a payment-card preview in the same space.
- Update the preview instantly as the user types or selects card details, using placeholders for unfinished values.
- Show the card front for number, name, and expiry; smoothly flip to the back when CVV is active.
- Once all card details are valid and focus leaves the fields, animate back to Transaction Details.
- Focusing any card field again will restore the animated card preview.

## Interaction and accessibility
- Preserve the existing payment flow, validation, transaction values, field layout, and submission behavior.
- Keep the preview height stable so the form does not jump while the panel transforms.
- Respect reduced-motion preferences by switching views without pronounced 3D movement.
- Ensure displayed CVV remains masked rather than exposing its digits on the preview.

## Technical details
- Add focused-field state to the existing card payment page and derive preview visibility from focus plus form completion.
- Implement the two-sided card and panel transition with local React state and CSS/Tailwind transitions only.
- Reuse the currently detected card brand, existing brand artwork, and existing entered form values.
- Verify on the current mobile viewport and desktop, including focus changes, live updates, CVV flip, completion return, and re-entry.
