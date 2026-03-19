import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const generateData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visits: Math.floor(25 + Math.random() * 60 + Math.sin(i / 3) * 20),
    });
  }
  return data;
};

const ranges = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export function TrafficChart() {
  const [range, setRange] = useState(1);
  const data = generateData(ranges[range].days);

  return (
    <div className="bg-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-lg">Website Traffic</h3>
        <div className="flex gap-1 bg-background rounded-lg p-1">
          {ranges.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRange(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                i === range ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(340, 62%, 57%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(340, 62%, 57%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 22%, 82%)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(20, 12%, 55%)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(20, 12%, 55%)" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(33, 38%, 89%)",
                border: "1px solid hsl(30, 22%, 82%)",
                borderRadius: "0.75rem",
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              stroke="hsl(340, 62%, 57%)"
              strokeWidth={2}
              fill="url(#visitsFill)"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
