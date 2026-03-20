import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
      navigate("/onboarding");
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      setSignInError(error.message);
    }
  };

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

          {activeTab === "signin" ? (
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

                {signInError && (
                  <p className="text-xs text-destructive">{signInError}</p>
                )}

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

                {signUpError && (
                  <p className="text-xs text-destructive">{signUpError}</p>
                )}

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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
