import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Minimal OAuth callback page for Google sign-in popup flow.
 * Supabase auto-exchanges the PKCE code on load. Once the session
 * is ready we notify the opener and close.
 */
export default function GoogleAuthCallback() {
  const [status, setStatus] = useState("Connecting your Google account…");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        setStatus("Connection failed. You can close this window.");
        return;
      }

      setStatus("Connected! Closing…");

      // Notify the onboarding wizard that OAuth is complete.
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "GOOGLE_OAUTH_COMPLETE" },
          window.location.origin
        );
      }

      // Close popup after a short delay so Supabase storage events propagate.
      setTimeout(() => window.close(), 600);
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}
