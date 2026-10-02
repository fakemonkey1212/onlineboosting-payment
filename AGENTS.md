
- Admin auth: all admin actions go through the admin-auth/secure-api edge functions with a server-side session (hashed token, HttpOnly cookie + in-memory bearer, CSRF header, 8h/30min expiry); admin DB functions are service_role only. Why: never trust the browser or send the password per request.
- Payment amounts remain validated decimal strings from trusted referrer through display; never coerce them for presentation. Why: preserve the exact received value.
- Production frontend output is minified and mangled without source maps; development remains debuggable. Why: deter casual source inspection without risking runtime behavior.
