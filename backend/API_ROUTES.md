# API Routes Reference

Base URL: `http://localhost:<PORT>/api` (global prefix `api` is set in `main.ts`)

**Auth model:** A global `JwtAuthGuard` protects every route by default. Routes marked `@Public()` skip it. Protected routes require:
```
Authorization: Bearer <accessToken>
```
Routes also using `@Roles(Role.ADMIN)` additionally require the caller's JWT to carry the `ADMIN` role.

The refresh token is **not** sent in the body — it's set as an `httpOnly` cookie named `refresh_token`, scoped to path `/auth`.

---

## Auth Routes (`/api/auth`)

### POST `/api/auth/register`
- **Auth:** Public
- **Rate limit:** 5 requests / 60s
- **Request body:**
```json
{
  "name": "string (2-100 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, must include uppercase, lowercase, number)"
}
```
- **Response:**
```json
{ "message": "Registration successful. Please check your email to verify your account." }
```

### GET `/api/auth/verify-email`
- **Auth:** Public
- **Query params:** `token` (string)
- **Response:**
```json
{ "message": "Email verified successfully" }
```

### POST `/api/auth/login`
- **Auth:** Public
- **Rate limit:** 5 requests / 5 min
- **Request body:**
```json
{
  "email": "string",
  "password": "string (min 8 chars)"
}
```
- **Response (2FA disabled):** sets `refresh_token` cookie
```json
{
  "twoFactorRequired": false,
  "user": { "id": "...", "name": "...", "email": "...", "avatar": "...", "role": "...", "isEmailVerified": true, "twoFactorEnabled": false, "...": "other non-sensitive user fields" },
  "accessToken": "string (JWT)"
}
```
- **Response (2FA enabled):** no cookie set yet
```json
{ "twoFactorRequired": true, "challengeToken": "string (short-lived JWT, 5 min)" }
```

### POST `/api/auth/2fa/verify-login`
- **Auth:** Public
- **Rate limit:** 8 requests / 5 min
- **Request body:**
```json
{
  "challengeToken": "string",
  "code": "string (6-9 chars: 6-digit TOTP or XXXX-XXXX backup code)"
}
```
- **Response:** sets `refresh_token` cookie
```json
{
  "user": { "...": "sanitized user object" },
  "accessToken": "string (JWT)"
}
```

### POST `/api/auth/forgot-password`
- **Auth:** Public
- **Rate limit:** 5 requests / 5 min
- **Request body:**
```json
{ "email": "string (valid email)" }
```
- **Response:**
```json
{ "message": "If an account exists for this email, a reset link has been sent." }
```

### POST `/api/auth/reset-password`
- **Auth:** Public
- **Request body:**
```json
{
  "token": "string",
  "newPassword": "string (min 8 chars, uppercase, lowercase, number)"
}
```
- **Response:**
```json
{ "message": "Password reset successfully. Please log in again." }
```

### POST `/api/auth/refresh`
- **Auth:** Public (but requires a valid `refresh_token` cookie, verified by `RefreshJwtGuard`)
- **Request body:** none
- **Response:** rotates and sets a new `refresh_token` cookie
```json
{ "accessToken": "string (JWT)" }
```

### POST `/api/auth/logout`
- **Auth:** Protected (Bearer token)
- **Request body:** none
- **Response:** clears `refresh_token` cookie
```json
{ "message": "Logged out" }
```

### POST `/api/auth/logout-all`
- **Auth:** Protected
- **Request body:** none
- **Response:** clears `refresh_token` cookie, revokes all sessions
```json
{ "message": "Logged out from all devices" }
```

### GET `/api/auth/2fa/setup`
- **Auth:** Protected
- **Request body:** none
- **Response:**
```json
{
  "secret": "string (TOTP secret)",
  "qrCodeDataUrl": "string (data URL for QR code image)"
}
```

### POST `/api/auth/2fa/enable`
- **Auth:** Protected
- **Request body:**
```json
{ "code": "string (6-9 chars, TOTP code from authenticator app)" }
```
- **Response:**
```json
{
  "message": "Two-factor authentication enabled",
  "backupCodes": ["string", "... (shown once only)"]
}
```

### POST `/api/auth/2fa/disable`
- **Auth:** Protected
- **Request body:**
```json
{ "code": "string (6-9 chars: TOTP or backup code)" }
```
- **Response:**
```json
{ "message": "Two-factor authentication disabled" }
```

### GET `/api/auth/login-activity`
- **Auth:** Protected
- **Request body:** none
- **Response:** array of the user's last 20 login attempts (Prisma `LoginActivity` rows), newest first
```json
[
  {
    "id": "string",
    "userId": "string",
    "success": true,
    "deviceName": "string",
    "ipAddress": "string",
    "createdAt": "ISO date",
    "...": "other LoginActivity fields"
  }
]
```

### GET `/api/auth/sessions`
- **Auth:** Protected
- **Request body:** none
- **Response:** array of active sessions, newest first
```json
[
  {
    "id": "string",
    "deviceName": "string",
    "ipAddress": "string",
    "createdAt": "ISO date",
    "expiresAt": "ISO date",
    "isCurrent": true
  }
]
```

### DELETE `/api/auth/sessions/:id`
- **Auth:** Protected
- **Path params:** `id` — session (refresh token) id
- **Request body:** none
- **Response:**
```json
{ "message": "Session revoked" }
```

### DELETE `/api/auth/sessions`
- **Auth:** Protected
- **Request body:** none
- **Response:** revokes all sessions (same as logout-all)
```json
{ "message": "Logged out from all devices" }
```

### GET `/api/auth/link-token/:provider`
- **Auth:** Protected
- **Path params:** `provider` — `"google"` or `"github"` only
- **Request body:** none
- **Response:**
```json
{ "state": "string (short-lived state token used to kick off the OAuth link flow)" }
```
- **Errors:** `400 Bad Request` if provider is not `google`/`github`

### GET `/api/auth/google`
- **Auth:** Public
- **Request body:** none
- **Response:** HTTP redirect to Google's OAuth consent screen (no JSON body)

### GET `/api/auth/google/callback`
- **Auth:** Public (invoked by Google after consent)
- **Query params:** provider-supplied (`code`, `state`, etc., handled by Passport strategy)
- **Response:** sets `refresh_token` cookie, then redirects to
`<frontendUrl>/oauth-success?accessToken=<accessToken>`

### GET `/api/auth/github`
- **Auth:** Public
- **Request body:** none
- **Response:** HTTP redirect to GitHub's OAuth consent screen (no JSON body)

### GET `/api/auth/github/callback`
- **Auth:** Public (invoked by GitHub after consent)
- **Query params:** provider-supplied (`code`, `state`, etc.)
- **Response:** sets `refresh_token` cookie, then redirects to
`<frontendUrl>/oauth-success?accessToken=<accessToken>`

---

## Users Routes (`/api/users`)

### GET `/api/users/me`
- **Auth:** Protected
- **Request body:** none
- **Response:** sanitized current user (no `passwordHash`, `twoFactorSecret`, `twoFactorBackupCodes`)
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string | null",
  "role": "USER | ADMIN",
  "provider": "LOCAL | GOOGLE | GITHUB",
  "isEmailVerified": true,
  "twoFactorEnabled": false,
  "createdAt": "ISO date",
  "...": "other non-sensitive User model fields"
}
```

### PATCH `/api/users/profile`
- **Auth:** Protected
- **Request body:**
```json
{
  "name": "string (2-100 chars, optional)",
  "avatar": "string (valid URL, optional)"
}
```
- **Response:** sanitized updated user object (same shape as `GET /api/users/me`)

### PATCH `/api/users/password`
- **Auth:** Protected
- **Request body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars, uppercase, lowercase, number-or-symbol)"
}
```
- **Response:** logs out all sessions
```json
{ "message": "Password changed successfully. Please log in again." }
```

### PATCH `/api/users/:id/role/:role`
- **Auth:** Protected + **Admin only** (`Role.ADMIN`)
- **Path params:** `id` — target user id, `role` — `"USER"` or `"ADMIN"`
- **Request body:** none
- **Response:** sanitized updated user object
- **Errors:** `400 Bad Request` if `role` is not a valid `Role` enum value

### GET `/api/users/linked-accounts`
- **Auth:** Protected
- **Request body:** none
- **Response:**
```json
{
  "hasPassword": true,
  "accounts": [
    {
      "id": "string",
      "provider": "GOOGLE | GITHUB",
      "email": "string",
      "avatar": "string | null",
      "createdAt": "ISO date"
    }
  ]
}
```

### DELETE `/api/users/linked-accounts/:id`
- **Auth:** Protected
- **Path params:** `id` — linked account id
- **Request body:** none
- **Response:**
```json
{ "message": "<PROVIDER> account disconnected" }
```
- **Errors:**
  - `404 Not Found` if the linked account doesn't belong to the user
  - `409 Conflict` if it's the user's only sign-in method (no password set, no other linked accounts)


