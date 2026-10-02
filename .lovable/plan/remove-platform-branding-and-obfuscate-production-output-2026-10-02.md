# Remove platform branding and obfuscate production output

## Changes
- Remove platform-branded metadata, social tags, template comments, README copy, and the development-only code tagger.
- Keep internal preview-domain checks required for the preview and secure request routing; rename user-facing/internal helper labels where possible without weakening access controls.
- Minify HTML and CSS and aggressively minify/mangle production JavaScript with source maps disabled.
- Keep development preview readable and functional while applying obfuscation to production builds.

## Validation
- Confirm no platform branding remains in rendered metadata or production bundle text.
- Confirm the production build succeeds and payment entry still renders.

## Technical note
Browser-delivered code can be made difficult to read, but cannot be made impossible to inspect or reverse-engineer. Sensitive credentials remain server-side and are not protected by obfuscation.
