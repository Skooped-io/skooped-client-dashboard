const activities = [
  { agent: "Scout", color: "bg-success", action: "Analyzed your Google rankings. You moved up 3 positions for 'fencing contractor Franklin TN'", time: "2 hours ago" },
  { agent: "Sierra", color: "bg-info", action: "Scheduled 3 Instagram posts for this week", time: "4 hours ago" },
  { agent: "Bob", color: "bg-success", action: "Updated your website's SEO meta tags for better click-through rates", time: "6 hours ago" },
  { agent: "Riley", color: "bg-secondary", action: "Generated your weekly performance report", time: "1 day ago" },
  { agent: "Mark", color: "bg-info", action: "Security scan complete. All clear ✓", time: "1 day ago" },
  { agent: "Cooper", color: "bg-primary", action: "Reviewed all agent activities and approved weekly strategy", time: "1 day ago" },
];

export function AgentActivityFeed() {
  return (
    <div className="bg-card rounded-lg p-5">
      <h3 className="font-heading font-bold text-lg mb-4">Agent Activity</h3>
      <div className="space-y-4">
        {activities.map((a, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className={`w-8 h-8 rounded-full ${a.color} flex items-center justify-center shrink-0`}>
              <span className="text-xs font-bold text-primary-foreground">{a.agent[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{a.agent}</span>
                <span className="text-muted-foreground"> — {a.action}</span>
              </p>
              <p className="text-xs text-muted-light mt-0.5">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 text-sm text-primary font-medium hover:underline">
        View all activity →
      </button>
    </div>
  );
}
