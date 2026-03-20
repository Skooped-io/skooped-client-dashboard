import { useState } from "react";
import { Link } from "react-router-dom";

interface LoginPageProps {
  defaultTab?: "signin" | "signup";
}

export default function LoginPage({ defaultTab = "signin" }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);

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
            <>
              <h1 className="text-xl font-heading font-bold text-center mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">Sign in to your client portal</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="you@business.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Link
                  to="/dashboard"
                  className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Sign In
                </Link>

                <button className="w-full text-xs text-primary text-center hover:underline">
                  Forgot password?
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors">
                  Sign in with Google
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Don't have an account?{" "}
                <button onClick={() => setActiveTab("signup")} className="text-primary hover:underline">
                  Create one
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-heading font-bold text-center mb-1">Get started</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">Create your Skooped account</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Full name</label>
                  <input
                    type="text"
                    placeholder="Jane Rodriguez"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="you@business.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Link
                  to="/onboarding"
                  className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Create Account
                </Link>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors">
                  Sign up with Google
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Already have an account?{" "}
                <button onClick={() => setActiveTab("signin")} className="text-primary hover:underline">
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
