import { Globe, Shield, ExternalLink } from "lucide-react";

const performanceScores = [
  { label: "Performance", score: 94 },
  { label: "Accessibility", score: 91 },
  { label: "Best Practices", score: 100 },
  { label: "SEO", score: 97 },
];

const recentChanges = [
  { action: "Updated homepage hero image", agent: "Bob", date: "March 18" },
  { action: "Added new service page", agent: "Bob", date: "March 15" },
  { action: "Optimized images for faster loading", agent: "Bob", date: "March 12" },
  { action: "Fixed mobile navigation menu", agent: "Bob", date: "March 10" },
];

const pages = [
  { name: "Home", path: "/", status: "Published", score: 96 },
  { name: "Services", path: "/services", status: "Published", score: 92 },
  { name: "Gallery", path: "/gallery", status: "Published", score: 88 },
  { name: "About", path: "/about", status: "Published", score: 91 },
  { name: "Contact", path: "/contact", status: "Published", score: 95 },
];

function ScoreCircle({ label, score }: { label: string; score: number }) {
  const color = score >= 90 ? "text-success" : score >= 70 ? "text-accent" : "text-primary";
  const strokeColor = score >= 90 ? "stroke-success" : score >= 70 ? "stroke-accent" : "stroke-primary";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6" className="stroke-border" />
          <circle
            cx="40" cy="40" r="36" fill="none" strokeWidth="6"
            className={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xl font-heading font-bold ${color}`}>
          {score}
        </span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export default function WebsitePage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Website</h1>
        <p className="text-muted-foreground mt-1">Your website status and recent updates</p>
      </div>

      {/* Status Card */}
      <div className="bg-card rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success/15 flex items-center justify-center">
              <Globe className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm font-semibold text-success">Live</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">tennesseefencing.com</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-light">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SSL Active</span>
                <span>Last updated: March 18</span>
              </div>
            </div>
          </div>
          <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            View Website <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Performance Scores */}
      <div className="bg-card rounded-lg p-5">
        <h3 className="font-heading font-bold text-lg mb-6">Performance Scores</h3>
        <div className="flex justify-center gap-8 md:gap-12 flex-wrap">
          {performanceScores.map((s) => (
            <ScoreCircle key={s.label} {...s} />
          ))}
        </div>
      </div>

      {/* Recent Changes */}
      <div className="bg-card rounded-lg p-5">
        <h3 className="font-heading font-bold text-lg mb-4">Recent Changes</h3>
        <div className="space-y-3">
          {recentChanges.map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <div className="w-2 h-2 rounded-full bg-info shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{c.action}</p>
                <p className="text-xs text-muted-light">{c.agent} — {c.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pages */}
      <div className="bg-card rounded-lg p-5">
        <h3 className="font-heading font-bold text-lg mb-4">Pages</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Page</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Path</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.path} className="border-b border-border/50">
                  <td className="py-3 px-2 font-medium">{p.name}</td>
                  <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{p.path}</td>
                  <td className="py-3 px-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">{p.status}</span>
                  </td>
                  <td className="py-3 px-2 text-right font-semibold">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
