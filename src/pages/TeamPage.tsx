const agents = [
  { name: "Cooper", title: "Operations Lead", status: "Active", statusColor: "bg-success", gradient: "from-primary to-maroon", bio: "Your main point of contact. Cooper oversees everything — from website quality to SEO strategy. If it has Skooped's name on it, Cooper approved it.", lastActive: "Just now" },
  { name: "Scout", title: "SEO Specialist", status: "Active", statusColor: "bg-success", gradient: "from-success to-accent", bio: "Scout monitors your Google rankings 24/7, researches keywords, and builds the strategy that gets your business found online.", lastActive: "2 hours ago" },
  { name: "Bob", title: "Web Developer", status: "Monitoring", statusColor: "bg-info", gradient: "from-info to-primary", bio: "Bob built your website from scratch and maintains it. Need a change? Bob handles it — fast, clean, no shortcuts.", lastActive: "6 hours ago" },
  { name: "Sierra", title: "Social Media", status: "Active", statusColor: "bg-success", gradient: "from-primary to-secondary", bio: "Sierra plans, creates, and schedules your social media content. Your online presence stays active even when you're busy.", lastActive: "4 hours ago" },
  { name: "Riley", title: "Analytics", status: "Monitoring", statusColor: "bg-info", gradient: "from-secondary to-accent", bio: "Riley tracks your numbers — traffic, rankings, conversions, ad performance. The data behind every decision we make.", lastActive: "1 day ago" },
  { name: "Mark", title: "Security", status: "Monitoring", statusColor: "bg-info", gradient: "from-chocolate to-maroon", bio: "Mark keeps your website secure and your data protected. Regular scans, SSL monitoring, vulnerability checks.", lastActive: "1 day ago" },
  { name: "Sandra", title: "Resource Intelligence", status: "Standby", statusColor: "bg-muted-light", gradient: "from-accent to-secondary", bio: "Sandra optimizes every dollar spent on your marketing. No wasted budget, no surprises.", lastActive: "3 days ago" },
];

export default function TeamPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Your Team</h1>
        <p className="text-muted-foreground mt-1">7 AI agents working for your business 24/7</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="bg-card rounded-lg p-5 card-hover group">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${agent.gradient} flex items-center justify-center shrink-0`}>
                <span className="text-lg font-heading font-bold text-primary-foreground">{agent.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-lg">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className={`w-2 h-2 rounded-full ${agent.statusColor}`} />
              <span className="text-xs font-medium text-muted-foreground">{agent.status}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{agent.bio}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span className="text-xs text-muted-light">Last active: {agent.lastActive}</span>
              <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View Activity →
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg p-4 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <span><strong className="text-foreground">7</strong> team members</span>
        <span className="text-border">|</span>
        <span>Active <strong className="text-foreground">24/7</strong></span>
        <span className="text-border">|</span>
        <span><strong className="text-foreground">843</strong> actions this month</span>
        <span className="text-border">|</span>
        <span>Your plan: <strong className="text-accent">Growth</strong></span>
      </div>
    </div>
  );
}
