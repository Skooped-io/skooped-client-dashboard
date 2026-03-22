import { useEffect } from "react";
import { Globe, Search, Phone, Star, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { TrafficChart } from "@/components/TrafficChart";
import { AgentActivityFeed } from "@/components/AgentActivityFeed";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const stats = [
  { icon: Globe, label: "Website Visits", value: 1247, trend: "12%", trendUp: true, accentClass: "bg-primary/15 text-primary" },
  { icon: Search, label: "Google Impressions", value: 8432, trend: "24%", trendUp: true, accentClass: "bg-secondary/30 text-accent" },
  { icon: Phone, label: "Phone Calls", value: 34, trend: "8%", trendUp: true, accentClass: "bg-success/15 text-success" },
  { icon: Star, label: "Google Rating", value: 4.8, trend: "12 reviews", trendUp: true, accentClass: "bg-secondary/30 text-secondary-foreground", decimals: 1 },
];

const quickActions = [
  { label: "Request a Website Update", to: "/dashboard/website" },
  { label: "View Latest Report", to: "/dashboard/analytics" },
  { label: "Schedule a Call", to: "/dashboard/settings" },
  { label: "Ask Cooper a Question", to: "/dashboard/ask" },
];

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const onboarding = params.get("onboarding");

    if (checkout === "success") {
      toast.success("Welcome! Your 14-day free trial has started 🎉");
      supabase.auth.updateUser({ data: { stripe_checkout_complete: true } }).catch(console.error);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (checkout === "cancelled") {
      toast("No worries! You can start your trial anytime from Settings.", { duration: 5000 });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (onboarding === "concierge") {
      toast.success("You're all set! We'll reach out within 24 hours to get started.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const businessName = user?.user_metadata?.business_name || "Welcome";

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">{greeting}, {businessName}</h1>
        <p className="text-muted-foreground mt-1">{dateStr} — Here's what your team has been up to</p>
      </div>

      {/* Stat Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Traffic Chart */}
      <TrafficChart />

      {/* Two Column: Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AgentActivityFeed />
        </div>

        <div className="bg-card rounded-lg p-5">
          <h3 className="font-heading font-bold text-lg mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-card-hover transition-colors group"
              >
                <span className="text-sm font-medium">{a.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Content */}
      <div className="bg-card rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg">Upcoming Content</h3>
          <Link to="/dashboard/content" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            View Calendar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { platform: "Instagram", date: "Tomorrow, 10:00 AM", caption: "Spring is here! Fresh season, fresh start for your business 🌱" },
            { platform: "Facebook", date: "Wed, 2:00 PM", caption: "Check out our latest project — clean work, happy client." },
            { platform: "Instagram", date: "Fri, 11:00 AM", caption: "Before & after: This transformation will blow your mind 🤯" },
          ].map((post, i) => (
            <div key={i} className="p-4 rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${post.platform === "Instagram" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>
                  {post.platform}
                </span>
                <span className="text-xs text-muted-light">{post.date}</span>
              </div>
              <p className="text-sm line-clamp-2">{post.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
