import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Globe, BarChart3, Calendar, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const subjectOptions = [
  "Website Update",
  "SEO Question",
  "Content Request",
  "Billing Question",
  "General Question",
  "Other",
];

const quickLinks = [
  { label: "Request a website change", to: "/dashboard/website", icon: Globe },
  { label: "View my analytics", to: "/dashboard/analytics", icon: BarChart3 },
  { label: "Check my content schedule", to: "/dashboard/content", icon: Calendar },
  { label: "Update my business info", to: "/dashboard/settings", icon: Settings },
];

export default function AskCooper() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message.trim()) return;
    toast({ title: "Message sent!", description: "Cooper will get back to you." });
    setSent(true);
    setSubject("");
    setMessage("");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <span className="text-2xl font-heading font-bold text-primary">C</span>
        </div>
        <h1 className="text-2xl font-heading font-bold">Cooper — Your Operations Lead</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Need something? Send a message and Cooper will get back to you.
        </p>
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4 mb-8">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1.5">Subject</label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="" disabled>Select a topic…</option>
            {subjectOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1.5">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what you need..."
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!subject || !message.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          Send Message
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Cooper typically responds within a few hours via email.
        </p>

        {sent && (
          <p className="text-sm text-center text-primary font-medium animate-fade-in">
            ✓ Message sent! Cooper will get back to you.
          </p>
        )}
      </form>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-heading font-bold mb-3">Common Requests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-card/80 transition-colors"
            >
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
