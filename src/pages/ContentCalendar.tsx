import { Calendar, CheckCircle } from "lucide-react";

const posts = [
  { platform: "Instagram", date: "Mon, Mar 20", time: "10:00 AM", caption: "Spring is here! Time to refresh your fence with our seasonal maintenance tips 🌱", status: "Scheduled" },
  { platform: "Facebook", date: "Wed, Mar 22", time: "2:00 PM", caption: "Check out our latest vinyl fence installation in Franklin — clean lines, zero maintenance.", status: "Scheduled" },
  { platform: "Instagram", date: "Fri, Mar 24", time: "11:00 AM", caption: "Before & after: This cedar fence transformation will blow your mind 🤯", status: "Draft" },
  { platform: "Instagram", date: "Mon, Mar 27", time: "10:00 AM", caption: "Did you know? A well-maintained fence can increase your property value by up to 10% 🏡", status: "Scheduled" },
  { platform: "Facebook", date: "Tue, Mar 28", time: "3:00 PM", caption: "Customer spotlight: The Johnson family's beautiful new privacy fence in Brentwood", status: "Draft" },
  { platform: "Instagram", date: "Thu, Mar 30", time: "12:00 PM", caption: "Pro tip: How to choose between wood and vinyl fencing for your property", status: "Scheduled" },
];

export default function ContentCalendar() {
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Content Calendar</h1>
        <p className="text-muted-foreground mt-1">Sierra manages your social media content schedule</p>
      </div>

      {/* Week View */}
      <div className="bg-card rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-bold text-lg">This Week</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
            const dayPosts = posts.filter((p) => p.date.startsWith(day));
            return (
              <div key={day} className="bg-background rounded-lg p-3 min-h-[120px]">
                <p className="text-xs font-semibold text-muted-foreground mb-2">{day}</p>
                {dayPosts.map((post, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-md text-xs mb-1 border ${
                      post.platform === "Instagram"
                        ? "border-primary/30 bg-primary/5"
                        : "border-info/30 bg-info/5"
                    } ${post.status === "Draft" ? "border-dashed" : ""}`}
                  >
                    <span className="font-semibold">{post.time}</span>
                    <p className="text-muted-foreground line-clamp-2 mt-0.5">{post.caption}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming List */}
      <div className="bg-card rounded-lg p-5">
        <h3 className="font-heading font-bold text-lg mb-4">Upcoming Posts</h3>
        <div className="space-y-3">
          {posts.map((post, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                post.platform === "Instagram" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"
              }`}>
                {post.platform}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-1">{post.caption}</p>
                <p className="text-xs text-muted-light mt-1">{post.date} at {post.time}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                post.status === "Scheduled" ? "bg-success/10 text-success" : "bg-secondary/30 text-muted-foreground"
              }`}>
                {post.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
