

## Plan: Hardcode Supabase Fallbacks

Since the Supabase URL and anon key are **publishable** (safe to expose client-side), I'll add them as fallback values in `src/lib/supabase.ts`.

### Change

**`src/lib/supabase.ts`** — Add fallback values so the app works even without env vars:

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ordxzakffddgytanahnc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

Environment variables still take priority when set (e.g. on Vercel), but the preview will no longer white-screen.

