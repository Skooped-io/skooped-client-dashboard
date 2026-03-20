import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const meta = user?.user_metadata ?? {};

  const profileFields = [
    { label: "Business Name", value: meta.business_name ?? "" },
    { label: "Contact Name", value: meta.full_name ?? "" },
    { label: "Email", value: user?.email ?? "" },
    { label: "Phone", value: meta.phone ?? "" },
    { label: "Website URL", value: meta.website ?? "" },
    { label: "Industry", value: meta.industry ?? "" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="bg-card rounded-lg p-5 space-y-4">
            {profileFields.map((field) => (
              <div key={field.label}>
                <label className="text-sm font-medium text-muted-foreground block mb-1.5">{field.label}</label>
                <input
                  defaultValue={field.value}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <button className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Save Changes
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold">Starter Plan</h3>
                  <p className="text-sm text-muted-foreground">$49/month · Next billing: April 1, 2024</p>
                  <p className="text-sm text-muted-foreground mt-1">Visa ending in 4242</p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">Active</span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-background border border-border text-sm font-medium hover:bg-card-hover transition-colors">
                  Change Plan
                </button>
                <button className="px-4 py-2 rounded-lg bg-background border border-border text-sm font-medium hover:bg-card-hover transition-colors">
                  Update Payment
                </button>
              </div>
            </div>

            <div className="bg-card rounded-lg p-5">
              <h3 className="font-heading font-bold mb-3">Invoice History</h3>
              <div className="space-y-2">
                {[
                  { date: "Mar 1, 2024", amount: "$49.00" },
                  { date: "Feb 1, 2024", amount: "$49.00" },
                  { date: "Jan 1, 2024", amount: "$49.00" },
                ].map((inv) => (
                  <div key={inv.date} className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{inv.date}</span>
                      <span className="text-sm font-semibold">{inv.amount}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-success font-medium">Paid ✅</span>
                      <button className="text-xs text-primary font-medium hover:underline">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="bg-card rounded-lg p-5 space-y-5">
            {[
              { label: "Weekly performance report", desc: "Email" },
              { label: "Agent activity summary", desc: "Email" },
              { label: "Security alerts", desc: "Email + SMS" },
              { label: "Content posted notifications", desc: "Email" },
              { label: "Ranking changes alerts", desc: "Email" },
            ].map((n, i) => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-muted-light">{n.desc}</p>
                </div>
                <Switch defaultChecked={i < 3} />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
