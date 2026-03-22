# Bob Task — Onboarding Auth & Flow Fixes

**Project:** skooped-client-dashboard
**Repo:** Skooped-io/skooped-client-dashboard
**Priority:** 🔴 High — blocks user testing
**Owner:** Bob (Builder)

---

## Task 1: Duplicate Email Signup Error Handling

**Problem:** When a user tries to sign up with an email that already exists in Supabase, the UI doesn't show a helpful error message. It either silently fails or shows a generic error.

**Fix:**
- In the signup flow (LoginPage.tsx or wherever signup is handled), catch the Supabase auth error for duplicate emails
- Supabase returns `{ error: { message: "User already registered" } }` (or similar) when a duplicate email is used
- Display a clear, styled error message: "An account with this email already exists."
- Below the error, show two options:
  - "Log in instead" → link to the login form
  - "Reset your password" → trigger Supabase password reset flow (`supabase.auth.resetPasswordForEmail()`)
- Error message should match the existing form styling — use the amber/warning color scheme already in the app

**Files likely affected:** LoginPage.tsx or the signup component

---

## Task 2: Fix "Go to Dashboard" Looping Back to Onboarding

**Problem:** After completing the onboarding wizard, clicking "Go to Dashboard" restarts the onboarding flow instead of navigating to the dashboard. The `onboarding_complete` flag is either not saving to Supabase properly, or the routing logic isn't reading it correctly.

**Debug checklist:**
1. Check `OnboardingWizard.tsx` → `finish()` function. It calls:
   ```js
   await supabase.auth.updateUser({
     data: { onboarding_complete: true, ... }
   });
   navigate("/dashboard");
   ```
   - Is the `updateUser` call succeeding? Add error handling if missing.
   - Is `navigate("/dashboard")` firing after the await completes?

2. Check the protected route / auth guard logic:
   - After login, something is checking `user.user_metadata.onboarding_complete` to decide whether to show onboarding vs dashboard
   - Is it reading from the correct field? (`user_metadata` vs `app_metadata` vs a separate Supabase table)
   - After `updateUser`, the local session might be stale. May need to call `supabase.auth.refreshSession()` before navigating.

3. Likely fix: After the `updateUser` call, refresh the session so the auth context has the updated metadata, THEN navigate:
   ```js
   await supabase.auth.updateUser({ data: { onboarding_complete: true, ... } });
   await supabase.auth.refreshSession();
   navigate("/dashboard");
   ```

**Files likely affected:** OnboardingWizard.tsx, AuthContext.tsx, ProtectedRoute.tsx or equivalent routing guard

---

## Task 3: Google OAuth → Google Business Profile API Wiring

**Problem:** The Google account connection step in onboarding currently uses mock/placeholder data. Need to wire real Google OAuth and Business Profile API.

**What needs to happen:**
1. When user clicks "Connect Google Account", initiate Google OAuth with the following scopes:
   - `https://www.googleapis.com/auth/business.manage` (Google Business Profile)
   - `https://www.googleapis.com/auth/webmasters.readonly` (Search Console)
   - `https://www.googleapis.com/auth/analytics.readonly` (GA4)
   - Store the OAuth tokens securely (Supabase `user_metadata` or a separate `google_tokens` table with encryption)

2. After successful OAuth, call the Google Business Profile API:
   - `GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations` (or the appropriate endpoint)
   - Return the list of business locations (name + address)

3. Replace the mock data in OnboardingWizard.tsx with real API response:
   - If 1 business → auto-select, show confirmation
   - If multiple → show the picker list (UI already built)
   - If 0 → show "no businesses found" message (UI already built)

4. Store the selected business ID in Supabase (user_metadata or organizations table) — this is what Scout will use later for SEO monitoring

**Note:** The Google Cloud project "Skooped" already exists with OAuth configured. The client ID and secret are in the Supabase Google OAuth provider settings. We may need to add the Business Profile API + Search Console API + Analytics API to the Google Cloud project's enabled APIs.

**This is the biggest task of the three.** Can be done after Tasks 1 and 2 if needed — the onboarding flow works without it (user can skip Google connection).

**Files likely affected:** New API route or utility for Google API calls, OnboardingWizard.tsx (replace mock data), possibly a new Supabase table for Google tokens

---

## Constraints
- Do NOT change any Lovable-designed UI components unless specifically needed for these fixes
- Do NOT restructure routing or auth flow — fix within the existing architecture
- Test with a fresh user account (all test accounts have been deleted from Supabase)
- Commit to a feature branch and open a PR for review
