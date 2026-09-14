# Sync payment branding

## Changes
- Use the main payment page merchant name for the cancellation page’s Payment Channel.
- Use the main payment page merchant photo in the “Processing Your Payment” loader.
- Keep live admin updates and existing fallbacks working.

## Technical details
- Read `gateway_name` and `gateway_logo` from the existing public app settings.
- Reuse the current local and realtime settings synchronization so changes appear without a refresh.
- Preserve the current GenZ logo and channel text when no custom branding is configured.

## Verification
- Confirm the app builds successfully.
- Check the loader and cancellation page against the main payment branding.
