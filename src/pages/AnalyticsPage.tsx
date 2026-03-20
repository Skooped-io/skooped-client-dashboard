import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const trafficSources = [
  { name: "Organic Search", value: 62, color: "hsl(340, 62%, 57%)" },
  { name: "Direct", value: 21, color: "hsl(32, 55%, 50%)" },
  { name: "Social", value: 11, color: "hsl(220, 82%, 65%)" },
  { name: "Referral", value: 4, color: "hsl(22, 55%, 28%)" },
  { name: "Paid", value: 2, color: "hsl(40, 64%, 69%)" },
];

const topPages = [
  { page: "/", views: 487, avgTime: "2:34", bounce: "32%" },
  { page: "/services", views: 234, avgTime: "3:12", bounce: "28%" },
  { page: "/gallery", views: 189, avgTime: "4:01", bounce: "22%" },
  { page: "/contact", views: 156, avgTime: "1:45", bounce: "41%" },
  { page: "/about", views: 98, avgTime: "2:10", bounce: "35%" },
];

const conversionsData = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  forms: Math.floor(5 + Math.random() * 10),
  calls: Math.floor(3 + Math.random() * 8),
  directions: Math.floor(2 + Math.random() * 6),
}));

const keywords = [
  { keyword: "best [service] near me", current: 3, previous: 6, volume: 720 },
  { keyword: "[service] contractor [city]", current: 7, previous: 9, volume: 1200 },
  { keyword: "[service] repair near me", current: 5, previous: 5, volume: 480 },
  { keyword: "[service] company near me", current: 12, previous: 18, volume: 3600 },
  { keyword: "affordable [service] [city]", current: 2, previous: 4, volume: 320 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your marketing performance</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="advertising">Advertising</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Sources */}
            <div className="bg-card rounded-lg p-5">
              <h3 className="font-heading font-bold mb-4">Traffic Sources</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" animationDuration={1200}>
                      {trafficSources.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conversions */}
            <div className="bg-card rounded-lg p-5">
              <h3 className="font-heading font-bold mb-4">Conversions by Week</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 22%, 82%)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="forms" fill="hsl(340, 62%, 57%)" radius={[4, 4, 0, 0]} name="Form Submissions" />
                    <Bar dataKey="calls" fill="hsl(32, 55%, 50%)" radius={[4, 4, 0, 0]} name="Phone Clicks" />
                    <Bar dataKey="directions" fill="hsl(22, 55%, 28%)" radius={[4, 4, 0, 0]} name="Direction Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-card rounded-lg p-5">
            <h3 className="font-heading font-bold mb-4">Top Pages</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Page</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Views</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Avg Time</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p) => (
                    <tr key={p.page} className="border-b border-border/50">
                      <td className="py-3 px-2 font-mono text-xs">{p.page}</td>
                      <td className="py-3 px-2 text-right font-semibold">{p.views}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">{p.avgTime}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">{p.bounce}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <div className="bg-card rounded-lg p-5">
            <h3 className="font-heading font-bold mb-4">Keyword Rankings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Keyword</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Position</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Change</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((k) => {
                    const change = k.previous - k.current;
                    return (
                      <tr key={k.keyword} className="border-b border-border/50">
                        <td className="py-3 px-2">{k.keyword}</td>
                        <td className="py-3 px-2 text-right font-semibold">#{k.current}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={change > 0 ? "text-success font-semibold" : change < 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                            {change > 0 ? `↑ ${change}` : change < 0 ? `↓ ${Math.abs(change)}` : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">{k.volume.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <div className="bg-card rounded-lg p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="font-heading font-bold mb-2">Social Media Analytics</h3>
            <p className="text-sm text-muted-foreground">Sierra is tracking your social performance. Detailed analytics coming soon!</p>
          </div>
        </TabsContent>

        <TabsContent value="advertising">
          <div className="bg-card rounded-lg p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📢</span>
            </div>
            <h3 className="font-heading font-bold mb-2">Advertising Dashboard</h3>
            <p className="text-sm text-muted-foreground">Available with Premium plan. Talk to Cooper about upgrading!</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
