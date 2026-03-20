import { NavLink } from "react-router-dom";
import {
  Home, BarChart3, Calendar, Globe, Users, MessageSquare, Settings,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/dashboard/content", icon: Calendar, label: "Content Calendar" },
  { to: "/dashboard/website", icon: Globe, label: "Website" },
  { to: "/dashboard/team", icon: Users, label: "Your Team" },
  { to: "/dashboard/ask", icon: MessageSquare, label: "Contact Cooper" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobile, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200",
        collapsed && !mobile ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-heading font-bold text-sm">S</span>
        </div>
        {(!collapsed || mobile) && (
          <span className="font-heading font-bold text-lg tracking-tight">Skooped</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-sidebar-border p-3">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-accent-foreground font-heading font-bold text-xs">TF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Tennessee Fencing</p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                Growth Plan
              </span>
            </div>
          </div>
        )}
        {!mobile && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </aside>
  );
}
