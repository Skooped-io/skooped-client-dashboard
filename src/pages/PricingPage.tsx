import { useNavigate, Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    description: "Perfect for getting your business online",
    features: [
      "Custom website",
      "Basic SEO",
      "Google Business Profile",
      "Monthly report",
    ],
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 99,
    description: "Everything you need to grow",
    features: [
      "Everything in Starter",
      "Social media management",
      "Google Ads management",
      "Weekly reports",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 149,
    description: "Maximum reach and results",
    features: [
      "Everything in Growth",
      "Advanced SEO",
      "Content creation",
      "Call tracking",
      "Dedicated account manager",
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between py-6 px-6 max-w-5xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-base">S</span>
          </div>
          <span className="font-heading font-bold text-lg">Skooped</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-base">
          Everything your local business needs to dominate online. No surprises, no hidden fees.
        </p>
      </div>

      {/* Plans */}
      <div className="flex flex-col md:flex-row gap-6 px-4 max-w-5xl mx-auto w-full pb-16 items-stretch">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`flex-1 bg-card rounded-lg p-6 flex flex-col transition-transform ${
              plan.popular
                ? "border-2 border-primary shadow-lg md:scale-105"
                : "border border-border"
            }`}
          >
            {plan.popular && (
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  MOST POPULAR
                </span>
              </div>
            )}
            <h2 className="text-xl font-heading font-bold">{plan.name}</h2>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
            <ul className="space-y-2.5 flex-1 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={handleGetStarted}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 ${
                plan.popular
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground hover:bg-muted"
              }`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-muted-foreground pb-12 px-4">
        No charge until your website is approved. Cancel anytime.
      </div>
    </div>
  );
}
