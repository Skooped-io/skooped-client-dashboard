import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-light">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-background border-b">
          <SheetTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-card">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <img src="/skooped-logo.svg" alt="Skooped" className="h-6" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
          <span className="font-heading font-bold text-lg">Skooped</span>
        </div>
        <SheetContent side="left" className="p-0 w-[260px] bg-sidebar border-none">
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} mobile onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="hidden md:block">
          <TopBar />
        </div>
        <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 md:mt-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
