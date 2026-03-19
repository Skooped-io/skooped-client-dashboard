import { useState } from "react";
import { Send } from "lucide-react";

const suggestedQuestions = [
  "How are my Google rankings?",
  "When is my next social post?",
  "Can you update my website?",
  "Show me this month's report",
  "What should I focus on next?",
];

const demoMessages = [
  { from: "user", text: "How are my Google rankings doing?" },
  { from: "cooper", text: "Great question! Your rankings are looking strong. You're currently ranking #3 for 'fencing contractor Franklin TN' — up 3 positions from last month. Scout has been optimizing your content and backlink strategy. Your top 5 keywords have all improved over the past 30 days. Want me to pull up the full keyword report?" },
  { from: "user", text: "That's awesome! What about my website traffic?" },
  { from: "cooper", text: "Your website had 1,247 visits this month — a 12% increase from last month. Most of your traffic is coming from organic search (62%), followed by direct visits (21%) and social media (17%). Bob also optimized your page load speed last week, which should help with conversions. Keep it up! 📈" },
];

export default function AskCooper() {
  const [messages] = useState(demoMessages);
  const [input, setInput] = useState("");

  return (
    <div className="animate-fade-in max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-heading font-bold">Ask Cooper</h1>
        <p className="text-muted-foreground text-sm">Your operations lead is here to help</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <span className="text-2xl font-heading font-bold text-primary">C</span>
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Hey there! I'm Cooper.</h3>
            <p className="text-sm text-muted-foreground mb-6">Ask me anything about your marketing, website, or analytics.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQuestions.map((q) => (
                <button key={q} className="px-3 py-2 text-sm rounded-lg bg-card hover:bg-card-hover transition-colors border border-border">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            {msg.from === "cooper" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 shrink-0 mt-1">
                <span className="text-xs font-bold text-primary-foreground">C</span>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm ${
              msg.from === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-card rounded-bl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about your marketing..."
          className="flex-1 px-4 py-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button className="p-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
