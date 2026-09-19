# OTP Email Verification — one-time Dashboard setup

The app now verifies signups with a **6-digit code** typed into the
verification screen (`Auth.jsx` → "Confirm it's you ✉️"). For the code
to arrive in the email (instead of a magic link), Supabase's signup
template must send the OTP token. This is a one-time toggle in the
Dashboard — the Management API/connector cannot edit email templates.

## Steps (2 minutes)

1. Open the [Supabase Dashboard](https://supabase.com/dashboard/project/nanhrvllkltgsdhjwjty/auth/templates)
2. Click **"Confirm signup"** in the templates list
3. Replace the template body with:

```html
<h2>Welcome to Momentry 💛</h2>

<p>Your verification code is:</p>

<p style="font-size: 32px; font-weight: 700; letter-spacing: 8px;">{{ .Token }}</p>

<p>This code expires in 24 hours. Enter it in the app to verify your email.</p>

<p>If you didn't create an account, you can safely ignore this email.</p>
```

4. **Save**

## Why `{{ .Token }}`?

- `{{ .Token }}` renders the 6-digit numeric code — exactly what
  `supabase.auth.verifyOtp({ email, token, type: "signup" })` expects.
- `{{ .ConfirmationURL }}` (the default) renders a magic link, which the
  new verify screen cannot accept.

## Rate limiting note

Supabase's built-in email service is strictly rate-limited (roughly
2 emails/hour on the free tier — you saw "email rate limit exceeded"
during partner-invite testing). This is fine for signups but painful
for resend. For production, connect custom SMTP:

1. Dashboard → **Project Settings → Authentication → SMTP Settings**
2. Add any provider (Resend, Postmark, SES — all have free tiers)
3. Auth emails then come from your own domain with far higher limits

## What works right now (no dashboard change)

- The verify screen appears on signup and handles codes correctly
- If the template still sends a link instead of a code, the user can
  click the link — Supabase marks the email verified and the app
  routes normally. The code screen is simply skipped.
- Resend has a 60s cooldown in the UI to respect rate limits
