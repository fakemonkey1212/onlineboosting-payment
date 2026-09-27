# Secure the Admin Login

## Problems found today
- The admin password is stored as plain text in the database.
- The browser keeps the admin password and sends it with every admin action.
- Admin database functions can be called directly from the public internet with a password guess, so the login can be bypassed and brute-forced.
- There is no real session: no expiry, no logout that cancels access, and no lockout after wrong guesses.

## What will change (user view)
- Admin login looks the same. After login, the password is never kept in the browser.
- Sessions end after 8 hours, or after 30 minutes of no activity. "Log out" ends the session on the server straight away.
- 5 wrong passwords in 15 minutes from the same connection or for the same email triggers a lockout that grows longer with each round.
- Changing the admin password logs out every other admin session.
- Payment pages, tokens, Telegram and Admin Panel live updates all keep working as they do now.

## Technical details
1. **Database (one migration)**
   - Hash the admin password with bcrypt (`pgcrypto crypt/gen_salt('bf', 12)`) and convert the existing value on the spot.
   - New private tables `admin_sessions` (sha256 token hash, csrf hash, ip, user agent, created/last_seen/expires, revoked_at) and `admin_login_attempts`. RLS on, service_role access only.
   - Revoke EXECUTE on every `admin_*`, `verify_admin_login`, `update_admin_secrets`, `_is_admin_password` function from `anon`/`authenticated`. Only `service_role` can call them, so nobody can reach them directly from the internet.
2. **New `admin-auth` edge function**: `login`, `logout`, `session`. Checks origin, applies rate limits (in the database, not in memory), and compares passwords in constant time using bcrypt. It creates a 32-byte random session token and CSRF token and stores only their hashes. Error messages stay generic.
3. **Session transport**
   - An HttpOnly, Secure, SameSite=None, `__Host-` style cookie scoped to the function domain.
   - Plus a required `X-CSRF-Token` header (double-submit, checked against the stored hash) and a strict Origin allow-list.
   - Fallback: if the browser blocks cross-site cookies (Safari/Brave), the session token is held in memory only (never in storage) and sent as a Bearer token. Bearer tokens are not open to CSRF by design.
4. **`secure-api` admin actions** take the session, not a password. Each call re-checks the session on the server (not revoked, not expired, idle timeout) and slides `last_seen`. Inputs are checked strictly with Zod, with ID/URL/key allow-lists, and all queries are parameterized. Password-changing actions still need the current password, and success revokes other sessions. Any admin call without a valid session gets 401.
5. **Frontend**
   - Remove `admin_pw` from `sessionStorage` and stop sending passwords from `AllowedWebsitesAdmin` and `PaymentGateway`.
   - The dashboard shows only after the server confirms the session.
   - On a 401, the admin is logged out automatically.
   - The admin realtime channels stop exposing admin data (they keep only public branding broadcasts).
6. Update `AGENTS.md` with the admin-auth rule, then run the security scan and linter.

## Limitation to know
Your site and its server live on different web addresses. Because of this, some browsers (Safari, Brave) block the HttpOnly cookie. In those browsers the fallback in step 3 keeps admin access in memory only, so a page reload means logging in again. Full cookie-only sessions on every browser would need a custom domain for the server, which isn't possible on the current hosting.
