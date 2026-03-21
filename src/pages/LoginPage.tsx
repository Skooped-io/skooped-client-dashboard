import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Mail, AlertCircle } from "lucide-react";

interface LoginPageProps {
  defaultTab?: "signin" | "signup";
}

export default function LoginPage({ defaultTab = "signin" }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Sign in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    setSignInLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    setSignInLoading(false);
    if (error) {
      setSignInError(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError("");
    if (signUpPassword !== signUpConfirm) {
      setSignUpError("Passwords do not match");
      return;
    }
    setSignUpLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, signUpName);
    setSignUpLoading(false);
    if (error) {
      setSignUpError(error.message);
    } else {
      setConfirmedEmail(signUpEmail);
      setSignUpSuccess(true);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      setSignInError(error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!signUpEmail) return;
    await supabase.auth.resetPasswordForEmail(signUpEmail, {
      redirectTo: window.location.origin + "/login",
    });
  };

  const isEmailNotConfirmed = signInError.toLowerCase().includes("email not confirmed");
  const isDuplicateEmail = signUpError.toLowerCase().includes("user already registered") ||
    signUpError.toLowerCase().includes("already been registered") ||
    signUpError.toLowerCase().includes("already exists");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">S</span>
            </div>
            <span className="font-heading font-bold text-xl">Skooped</span>
          </div>

          {/* Tabs */}
          {!signUpSuccess && (
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                onClick={() => setActiveTab("signin")}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  activeTab === "signin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  activeTab === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {signUpSuccess ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-heading font-bold mb-2">Check your email!</h2>
              <p className="text-sm text-muted-foreground mb-1">
                We sent a confirmation link to{" "}
                <span className="font-semibold text-foreground">{confirmedEmail}</span>.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Click the link in your email to activate your account.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Didn't get it? Check your spam folder or try again.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSignUpSuccess(false);
                  setActiveTab("signin");
                }}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Back to Sign In
              </button>
            </div>
          ) : activeTab === "signin" ? (
            <form onSubmit={handleSignIn}>
              <h1 className="text-xl font-heading font-bold text-center mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">Sign in to your client portal</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="you@business.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {signInError && isEmailNotConfirmed ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Email not confirmed yet</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Please check your inbox for the confirmation link we sent to your email. Click the link to activate your account, then come back and sign in.
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5">
                          Didn't receive it? Check your spam folder.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : signInError ? (
                  <p className="text-xs text-destructive">{signInError}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {signInLoading ? "Signing in…" : "Sign In"}
                </button>

                <button type="button" className="w-full text-xs text-primary text-center hover:underline">
                  Forgot password?
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors"
                >
                  Sign in with Google
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Don't have an account?{" "}
                <button type="button" onClick={() => setActiveTab("signup")} className="text-primary hover:underline">
                  Create one
                </button>
              </p>
              <p className="text-xs text-muted-foreground text-center mt-3">
                <Link to="/pricing" className="text-primary hover:underline">
                  View our plans
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <h1 className="text-xl font-heading font-bold text-center mb-1">Get started</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">Create your Skooped account</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Full name</label>
                  <input
                    type="text"
                    placeholder="Jane Rodriguez"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="you@business.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={signUpConfirm}
                    onChange={(e) => setSignUpConfirm(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {signUpError && isDuplicateEmail ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">An account with this email already exists.</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab("signin")}
                            className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            Log in instead
                          </button>
                          <span className="text-xs text-amber-400">·</span>
                          <button
                            type="button"
                            onClick={handlePasswordReset}
                            className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            Reset your password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : signUpError ? (
                  <p className="text-xs text-destructive">{signUpError}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {signUpLoading ? "Creating account…" : "Create Account"}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors"
                >
                  Sign up with Google
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Already have an account?{" "}
                <button type="button" onClick={() => setActiveTab("signin")} className="text-primary hover:underline">
                  Sign in
                </button>
              </p>
              <p className="text-xs text-muted-foreground text-center mt-3">
                <Link to="/pricing" className="text-primary hover:underline">
                  View our plans
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
