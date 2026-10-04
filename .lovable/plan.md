# Refine card fields and preview switching

## Changes
- Reduce the card input text and control heights while preserving readability and the current phone-fit layout.
- Make the selected card information row use smaller adaptive text so the card type, funding type, full bank name, and country remain on one line without truncation.
- Close the animated card preview whenever the user clicks outside the preview and card-entry controls.
- Restore the animated preview whenever any card field is focused again, retaining every entered value exactly.

## Verification
- Check the selected details row with a long bank name at the current phone size.
- Check outside-click return, field re-entry, live card values, CVV flip, and no-scroll behavior.
