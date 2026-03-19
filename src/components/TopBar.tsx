import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/analytics": "Analytics",
  "/dashboard/content": "Content Calendar",
  "/dashboard/website": "Website",
  "/dashboard/team": "Your Team",
  "/dashboard/ask": "Ask Cooper",
  "/dashboard/settings": "Settings",
};

export function TopBar() {
  const { pathname } = useLocation();
  const pageName = pageNames[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-border bg-background-light/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Skooped</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold">{pageName}</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-card transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-heading font-bold text-xs">TF</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
