import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { fetchGoogleBusinessLocations } from "@/lib/googleBusinessProfile";
import { buildSiteConfig, saveSiteConfig } from "@/lib/templateConfig";
import { createCheckoutSession } from "@/lib/stripeCheckout";
import { toast } from "sonner";
import {
  Check, ChevronRight, Upload, X, Sparkles, ExternalLink, Plus,
  Hammer, Fence, Wind, Wrench, TreePine, Scissors, Heart, Paintbrush,
  Crown, Loader2, MapPin, Building2, Home, Car, Dumbbell, Zap, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const TOTAL_STEPS = 7;

const INDUSTRY_TEMPLATES = [
  { id: "Roofing", label: "Roofing", icon: Home, preview: "https://skooped-io.github.io/roofing-template/" },
  { id: "Landscaping", label: "Landscaping", icon: TreePine, preview: "https://skooped-io.github.io/landscaping-template/" },
  { id: "Fencing", label: "Fencing", icon: Fence, preview: "https://skooped-io.github.io/fencing-template/" },
  { id: "Therapy", label: "Therapy", icon: Heart, preview: "https://skooped-io.github.io/therapy-template/" },
  { id: "Construction", label: "Construction", icon: Hammer, preview: "https://skooped-io.github.io/construction-template/" },
  { id: "AutoRepair", label: "Auto Repair", icon: Car, preview: "https://skooped-io.github.io/auto-repair-template/" },
  { id: "LifeCoaching", label: "Life Coaching", icon: Brain, preview: "https://skooped-io.github.io/life-coaching-template/" },
  { id: "RealEstate", label: "Real Estate", icon: Building2, preview: "https://skooped-io.github.io/real-estate-agent-template/" },
  { id: "PersonalTraining", label: "Personal Training", icon: Dumbbell, preview: "https://skooped-io.github.io/personal-training-template/" },
  { id: "Salon", label: "Salon / Barber", icon: Scissors, preview: "https://skooped-io.github.io/salon-barber-shop-template/" },
  { id: "Plumbing", label: "Plumbing", icon: Wrench, preview: "https://skooped-io.github.io/plumbing-template/" },
  { id: "Electrical", label: "Electrical", icon: Zap, preview: "https://skooped-io.github.io/electrical-template/" },
];

const INDUSTRY_SERVICES: Record<string, string[]> = {
  Roofing: ["Roof Repair", "Roof Replacement", "New Roof Installation", "Roof Inspection", "Emergency Roof Repair", "Storm Damage Repair", "Gutter Installation", "Metal Roofing", "Flat Roofing", "Commercial Roofing", "Shingle Roofing", "Tile Roofing"],
  Fencing: ["Wood Fencing", "Vinyl Fencing", "Chain Link Fencing", "Aluminum Fencing", "Iron Fencing", "Privacy Fencing", "Pool Fencing", "Farm & Ranch Fencing", "Gate Installation", "Fence Repair", "Commercial Fencing", "Custom Fencing"],
  HVAC: ["AC Repair", "AC Installation", "Heating Repair", "Furnace Installation", "Duct Cleaning", "Thermostat Installation", "Maintenance Plans", "Emergency Service", "Commercial HVAC", "Air Quality Testing"],
  Plumbing: ["Drain Cleaning", "Leak Repair", "Water Heater Install", "Pipe Repair", "Sewer Line Repair", "Fixture Installation", "Emergency Plumbing", "Gas Line Repair", "Water Filtration", "Bathroom Remodel"],
  Landscaping: ["Lawn Care", "Landscape Design", "Tree Trimming", "Hardscaping", "Irrigation Systems", "Mulching", "Sod Installation", "Seasonal Cleanup", "Outdoor Lighting", "Retaining Walls"],
  Salon: ["Haircuts", "Color & Highlights", "Blowouts", "Extensions", "Facials", "Waxing", "Manicure & Pedicure", "Massage", "Bridal Services"],
  Therapy: ["Individual Therapy", "Couples Therapy", "Family Therapy", "Group Sessions", "EMDR", "CBT", "Anxiety Treatment", "Depression Treatment", "Trauma Recovery"],
  Painting: ["Interior Painting", "Exterior Painting", "Cabinet Painting", "Deck Staining", "Pressure Washing", "Drywall Repair", "Commercial Painting", "Color Consultation"],
  Construction: ["General Contracting", "Home Additions", "Kitchen Remodel", "Bathroom Remodel", "Basement Finishing", "Deck Building", "Concrete Work", "Demolition", "Commercial Construction"],
  AutoRepair: ["Oil Change", "Brake Repair", "Engine Diagnostics", "Transmission Repair", "Tire Service", "AC Repair", "Electrical Systems", "Suspension", "State Inspection"],
  LifeCoaching: ["Career Coaching", "Executive Coaching", "Relationship Coaching", "Health & Wellness", "Goal Setting", "Accountability", "Mindset Training", "Group Coaching"],
  RealEstate: ["Buyer Representation", "Seller Representation", "Market Analysis", "Home Staging", "Investment Properties", "First-Time Buyers", "Luxury Homes", "Commercial Real Estate"],
  PersonalTraining: ["1-on-1 Training", "Group Training", "Online Coaching", "Nutrition Planning", "Weight Loss", "Strength Training", "Sports Performance", "Rehab & Recovery"],
  Electrical: ["Residential Wiring", "Panel Upgrades", "Outlet Installation", "Lighting", "Ceiling Fans", "Generator Install", "EV Charger Install", "Troubleshooting", "Commercial Electrical"],
};

const COLOR_PRESETS = [
  { name: "Bold Red", value: "#DC2626" },
  { name: "Navy Blue", value: "#1E3A5F" },
  { name: "Forest Green", value: "#166534" },
  { name: "Orange", value: "#EA580C" },
  { name: "Dark Gray", value: "#374151" },
  { name: "Royal Purple", value: "#7C3AED" },
  { name: "Teal", value: "#0D9488" },
];

const FONT_OPTIONS = [
  { id: "modern", label: "Modern", description: "Clean sans-serif", fonts: "Inter, DM Sans" },
  { id: "classic", label: "Classic", description: "Slightly serif", fonts: "Playfair Display, Lato" },
  { id: "friendly", label: "Friendly", description: "Rounded", fonts: "Nunito, Quicksand" },
];

interface GoogleBusiness {
  id: string;
  name: string;
  address: string;
}

interface OnboardingData {
  template: string;
  plan: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  serviceArea: string;
  yearEstablished: string;
  licenseNumber: string;
  industry: string;
  services: string[];
  customServices: string[];
  aboutText: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontStyle: string;
  googleConnected: boolean;
  googleEmail: string;
  selectedGoogleBusiness: string;
  conciergeRequested: boolean;
}

const defaultData: OnboardingData = {
  template: "Roofing",
  plan: "Growth",
  businessName: "",
  ownerName: "",
  phone: "",
  email: "user@example.com",
  street: "",
  city: "",
  state: "",
  zip: "",
  serviceArea: "",
  yearEstablished: "",
  licenseNumber: "",
  industry: "Roofing",
  services: [],
  customServices: [],
  aboutText: "",
  logo: null,
  primaryColor: "#DC2626",
  secondaryColor: "#F3F4F6",
  fontStyle: "modern",
  googleConnected: false,
  googleEmail: "",
  selectedGoogleBusiness: "",
  conciergeRequested: false,
};

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2 w-full max-w-md mx-auto">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-border">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: i < step ? "100%" : "0%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      ))}
    </div>
  );
}

function MiniPreview({ data }: { data: OnboardingData }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-lg bg-background-light" style={{ minHeight: 340 }}>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border" style={{ backgroundColor: data.primaryColor }}>
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="h-5 w-5 object-contain rounded" />
        ) : (
          <div className="h-5 w-5 rounded bg-primary-foreground/30" />
        )}
        <span className="text-xs font-bold text-primary-foreground truncate">{data.businessName || "Your Business"}</span>
        <div className="ml-auto flex gap-3">
          {["Home", "About", "Services", "Contact"].map((p) => (
            <span key={p} className="text-[10px] text-primary-foreground/70">{p}</span>
          ))}
        </div>
      </div>
      <div className="px-6 py-8 text-center" style={{ background: `linear-gradient(135deg, ${data.primaryColor}15, ${data.secondaryColor})` }}>
        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: data.fontStyle === "classic" ? "serif" : data.fontStyle === "friendly" ? "Nunito, sans-serif" : "DM Sans, sans-serif" }}>
          {data.businessName || "Your Business Name"}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">Trusted. Reliable. Professional.</p>
        <div className="inline-block px-4 py-1.5 rounded-lg text-xs font-semibold text-primary-foreground" style={{ backgroundColor: data.primaryColor }}>
          Get a Free Estimate
        </div>
      </div>
      <div className="px-6 py-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Our Services</p>
        <div className="flex flex-wrap gap-1.5">
          {(data.services.length > 0 ? data.services.slice(0, 4) : ["Service 1", "Service 2", "Service 3"]).map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-card text-card-foreground">{s}</span>
          ))}
        </div>
      </div>
      <div className="px-6 py-2 border-t border-border">
        <p className="text-[9px] text-muted-foreground text-center">© {new Date().getFullYear()} {data.businessName || "Your Business"}</p>
      </div>
    </div>
  );
}

function CyclingText() {
  const phrases = [
    "Setting up your website...",
    "Configuring your dashboard...",
    "Optimizing for search engines...",
    "Almost there...",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-primary font-medium"
      >
        {phrases[index]}
      </motion.span>
    </AnimatePresence>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<OnboardingData>(() => ({
    ...defaultData,
    email: user?.email || defaultData.email,
    ownerName: user?.user_metadata?.full_name || user?.user_metadata?.name || "",
  }));
  const [conciergeConfirmed, setConciergeConfirmed] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleBusinesses, setGoogleBusinesses] = useState<GoogleBusiness[]>([]);
  const [step2Attempted, setStep2Attempted] = useState(false);
  const [step3Attempted, setStep3Attempted] = useState(false);

  // Step 2 validation
  const step2Errors = {
    businessName: data.businessName.trim().length < 2,
    phone: data.phone.trim().length < 7,
    city: !data.city.trim(),
    state: !data.state.trim(),
  };
  const step2Valid = !step2Errors.businessName && !step2Errors.phone && !step2Errors.city && !step2Errors.state;

  // Step 3 validation
  const step3Valid = data.services.length >= 3;
  const googleCompletedRef = useRef(false);

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData((d) => ({ ...d, ...partial }));
  }, []);

  // On mount, hydrate form state from existing user_metadata and resume at the right step.
  useEffect(() => {
    const m = user?.user_metadata;
    if (!m) return;

    const updates: Partial<OnboardingData> = {};
    if (m.template) updates.template = m.template;
    if (m.industry) updates.industry = m.industry;
    if (m.plan) updates.plan = m.plan;
    if (m.business_name) updates.businessName = m.business_name;
    if (m.owner_name) updates.ownerName = m.owner_name;
    if (m.phone) updates.phone = m.phone;
    if (m.street) updates.street = m.street;
    if (m.city) updates.city = m.city;
    if (m.state) updates.state = m.state;
    if (m.zip) updates.zip = m.zip;
    if (m.service_area) updates.serviceArea = m.service_area;
    if (m.year_established) updates.yearEstablished = m.year_established;
    if (m.license_number) updates.licenseNumber = m.license_number;
    if (m.services) updates.services = m.services;
    if (m.about_text) updates.aboutText = m.about_text;
    if (m.primary_color) updates.primaryColor = m.primary_color;
    if (m.secondary_color) updates.secondaryColor = m.secondary_color;
    if (m.font_style) updates.fontStyle = m.font_style;
    if (m.logo_url) updates.logo = m.logo_url;
    if (m.google_connected) updates.googleConnected = m.google_connected;

    if (Object.keys(updates).length > 0) {
      setData((d) => ({ ...d, ...updates }));
    }

    // Resume at the furthest completed step.
    let startStep = 0;
    if (m.template) startStep = 1;
    if (m.plan) startStep = 2;
    if (m.business_name) startStep = 3;
    if (m.services) startStep = 4;
    if (m.primary_color) startStep = 5;
    if (m.google_connected) startStep = 6;
    if (startStep > 0) setStep(startStep);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save the current step's data to user_metadata silently (non-blocking).
  const saveStepData = useCallback((currentStep: number, currentData: OnboardingData) => {
    if (!user) return;

    let stepPayload: Record<string, unknown> = {};
    switch (currentStep) {
      case 0:
        stepPayload = { template: currentData.template, industry: currentData.industry };
        break;
      case 1:
        stepPayload = { plan: currentData.plan };
        break;
      case 2:
        stepPayload = {
          business_name: currentData.businessName,
          owner_name: currentData.ownerName,
          phone: currentData.phone,
          street: currentData.street,
          city: currentData.city,
          state: currentData.state,
          zip: currentData.zip,
          service_area: currentData.serviceArea,
          year_established: currentData.yearEstablished,
          license_number: currentData.licenseNumber,
        };
        break;
      case 3:
        stepPayload = { services: currentData.services, about_text: currentData.aboutText };
        break;
      case 4:
        stepPayload = {
          primary_color: currentData.primaryColor,
          secondary_color: currentData.secondaryColor,
          font_style: currentData.fontStyle,
          logo_url: currentData.logo,
        };
        break;
      default:
        return;
    }

    supabase.auth.updateUser({ data: stepPayload }).catch((err) => {
      console.error("Failed to auto-save step data:", err);
    });
  }, [user]);

  const next = () => {
    saveStepData(step, data);
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const back = () => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const toggleService = (svc: string) => {
    setData((d) => ({
      ...d,
      services: d.services.includes(svc) ? d.services.filter((s) => s !== svc) : [...d.services, svc],
    }));
  };

  const addCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (trimmed && !data.customServices.includes(trimmed) && !data.services.includes(trimmed)) {
      setData((d) => ({
        ...d,
        customServices: [...d.customServices, trimmed],
        services: [...d.services, trimmed],
      }));
      setCustomServiceInput("");
    }
  };

  const removeCustomService = (svc: string) => {
    setData((d) => ({
      ...d,
      customServices: d.customServices.filter((s) => s !== svc),
      services: d.services.filter((s) => s !== svc),
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => update({ logo: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    update({ template: templateId, industry: templateId });
  };

  const connectGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    googleCompletedRef.current = false;

    // If the user already signed in with Google, provider_token is in the session.
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.provider_token) {
      try {
        const businesses = await fetchGoogleBusinessLocations(currentSession.provider_token);
        setGoogleBusinesses(businesses);
        update({
          googleConnected: true,
          googleEmail: currentSession.user.email ?? data.email,
          ...(businesses.length === 1 ? { selectedGoogleBusiness: businesses[0].id } : {}),
        });
      } catch {
        setGoogleError("Connected, but we couldn't load your Google Business listings. You can skip for now and reconnect later.");
        update({ googleConnected: true, googleEmail: currentSession.user.email ?? data.email });
      }
      setGoogleLoading(false);
      return;
    }

    // Initiate Google OAuth in a popup with the required scopes.
    const { data: oauthData, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        skipBrowserRedirect: true,
        scopes: [
          "https://www.googleapis.com/auth/business.manage",
          "https://www.googleapis.com/auth/webmasters.readonly",
          "https://www.googleapis.com/auth/analytics.readonly",
        ].join(" "),
        queryParams: { access_type: "offline", prompt: "consent" },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error || !oauthData?.url) {
      setGoogleError("Failed to start Google authorization. Please try again.");
      setGoogleLoading(false);
      return;
    }

    const popup = window.open(oauthData.url, "GoogleOAuth", "width=600,height=700,scrollbars=yes");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.provider_token && !googleCompletedRef.current) {
        googleCompletedRef.current = true;
        subscription.unsubscribe();
        popup?.close();

        // Persist tokens in user_metadata so Scout/backend can use them later.
        await supabase.auth.updateUser({
          data: {
            google_access_token: session.provider_token,
            google_refresh_token: session.provider_refresh_token ?? null,
            google_connected: true,
          },
        });

        try {
          const businesses = await fetchGoogleBusinessLocations(session.provider_token);
          setGoogleBusinesses(businesses);
          update({
            googleConnected: true,
            googleEmail: session.user.email ?? data.email,
            ...(businesses.length === 1 ? { selectedGoogleBusiness: businesses[0].id } : {}),
          });
        } catch {
          setGoogleError("Connected! But we couldn't load your Google Business listings. You can skip for now.");
          update({ googleConnected: true, googleEmail: session.user.email ?? data.email });
        }
        setGoogleLoading(false);
      }
    });

    // Handle user closing the popup without completing OAuth.
    const pollTimer = setInterval(() => {
      if (popup?.closed && !googleCompletedRef.current) {
        clearInterval(pollTimer);
        subscription.unsubscribe();
        setGoogleLoading(false);
      }
    }, 1000);
  };

  const finish = async () => {
    localStorage.setItem("skooped_onboarding", JSON.stringify(data));
    if (user) {
      const selectedBiz = googleBusinesses.find((b) => b.id === data.selectedGoogleBusiness);
      const { error } = await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          business_name: data.businessName,
          industry: data.industry,
          services: data.services,
          plan: data.plan,
          ...(data.selectedGoogleBusiness
            ? {
                google_business_id: data.selectedGoogleBusiness,
                google_business_name: selectedBiz?.name ?? null,
              }
            : {}),
        },
      });
      if (error) {
        console.error("Failed to save onboarding data:", error.message);
      }

      // Build and persist the canonical site config for the deployment pipeline.
      const siteConfig = buildSiteConfig({
        business_name: data.businessName,
        owner_name: data.ownerName,
        phone: data.phone,
        email: data.email,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        service_area: data.serviceArea,
        year_established: data.yearEstablished,
        license_number: data.licenseNumber,
        industry: data.industry,
        services: data.services,
        about_text: data.aboutText,
        primary_color: data.primaryColor,
        secondary_color: data.secondaryColor,
        font_style: data.fontStyle,
        logo_url: data.logo,
        template: data.template,
        plan: data.plan,
        google_business_id: data.selectedGoogleBusiness || null,
      });
      await saveSiteConfig(user.id, siteConfig).catch((err) => {
        console.error("Failed to save site config:", err);
      });

      // Refresh the session so ProtectedRoute reads the updated user_metadata
      await supabase.auth.refreshSession();
    }

    // Concierge: skip Stripe, navigate directly
    if (data.template === "concierge") {
      navigate("/dashboard?onboarding=concierge");
      return;
    }

    // All paid plans: redirect to Stripe Checkout
    try {
      const checkoutUrl = await createCheckoutSession(
        data.plan,
        user?.email ?? "",
        user?.id ?? ""
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Stripe Checkout failed:", err);
      toast.warning("Couldn't start checkout — you can set up billing from Settings.");
      navigate("/dashboard");
    }
  };

  const inputClass = "bg-card border-border focus:border-primary focus:ring-primary/20 rounded-lg";

  const steps = [
    // Step 0: Template Selection
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-heading font-bold">Let's get your business online</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">Pick a template that fits your industry, or let Cooper build something custom.</p>
      </div>

      {/* Industry template grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {INDUSTRY_TEMPLATES.map(({ id, label, icon: Icon, preview }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTemplateSelect(id)}
            className={`relative text-left p-4 rounded-xl border-2 transition-all group ${
              data.template === id && data.template !== "custom" && data.template !== "concierge"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            {data.template === id && data.template !== "custom" && data.template !== "concierge" && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <Icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
            <p className="text-sm font-semibold">{label}</p>
            <a
              href={preview}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-primary hover:underline mt-1 inline-flex items-center gap-0.5"
            >
              Preview <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </button>
        ))}
      </div>

      {/* Custom Build with Cooper */}
      <button
        type="button"
        onClick={() => {
          update({ template: "custom" });
          setConciergeConfirmed(false);
        }}
        className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
          data.template === "custom"
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-dashed border-primary/40 bg-gradient-to-r from-primary/5 to-accent/10 hover:border-primary"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-heading font-bold text-base">Custom Build with Cooper</p>
              {data.template === "custom" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
              <p className="text-sm text-muted-foreground mt-0.5">Want something unique? Cooper will design a custom site tailored to your brand.</p>
              <p className="text-xs font-bold text-primary mt-1">$299 one-time</p>
            </div>
          </div>
        </button>

      {/* Build with Cooper + Jake */}
      <button
        type="button"
        onClick={() => {
          update({ template: "concierge", conciergeRequested: true });
          setConciergeConfirmed(false);
        }}
        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
          data.template === "concierge"
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border bg-card hover:border-primary/40"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Build with Cooper + Jake</p>
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">Concierge</span>
              {data.template === "concierge" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Get hands-on help from our founder. Strategy, design, and development — personally built for your business.</p>
            <p className="text-xs font-bold text-accent mt-1">Custom Pricing</p>
          </div>
        </div>
      </button>

      {/* Concierge confirmation message */}
      {data.template === "concierge" && !conciergeConfirmed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-accent/20 border border-accent text-center space-y-3"
        >
          <p className="text-sm font-medium">We'll reach out to set up a call with Jake.</p>
          <p className="text-xs text-muted-foreground">Expect to hear from us within 24 hours.</p>
          <Button size="sm" onClick={() => setConciergeConfirmed(true)}>
            Sounds great <Check className="w-3.5 h-3.5 ml-1" />
          </Button>
        </motion.div>
      )}

      <div className="text-center">
        <Button size="lg" onClick={next} className="px-8">
          Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>,

    // Step 1: Plan Selection
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-heading font-bold">Choose your plan</h2>
        <p className="text-sm text-muted-foreground">You can change this anytime</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: "Starter",
            price: "$49/mo",
            features: ["Custom website", "Basic SEO", "Google Business Profile", "Monthly report"],
            popular: false,
          },
          {
            id: "Growth",
            price: "$99/mo",
            features: ["Everything in Starter", "Social media mgmt", "Google Ads", "Weekly reports", "Priority support"],
            popular: true,
          },
          {
            id: "Scale",
            price: "$149/mo",
            features: ["Everything in Growth", "Advanced SEO", "Content creation", "Call tracking", "Dedicated account manager"],
            popular: false,
          },
        ].map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => update({ plan: plan.id })}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              data.plan === plan.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {plan.popular && (
              <div className="mb-2">
                <span className="inline-block px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                  POPULAR
                </span>
              </div>
            )}
            <div className="font-heading font-bold text-base">{plan.id}</div>
            <div className="text-xl font-bold mt-0.5 mb-2">{plan.price}</div>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3 h-3 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">No charge until your website is approved.</p>
    </div>,

    // Step 2: Business Details
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-heading font-bold">Business Details</h2>
        <p className="text-sm text-muted-foreground">Tell us about your business</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Business Name *</Label>
          <Input className={inputClass} placeholder="e.g., Anderson Roofing Co." value={data.businessName} onChange={(e) => update({ businessName: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Your Name *</Label>
          <Input className={inputClass} placeholder="Your full name" value={data.ownerName} onChange={(e) => update({ ownerName: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Phone Number *</Label>
          <Input className={inputClass} placeholder="Main business number" value={data.phone} onChange={(e) => update({ phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Email *</Label>
          <Input className={`${inputClass} bg-muted cursor-not-allowed`} value={data.email} readOnly disabled />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Business Address *</Label>
        <Input className={inputClass} placeholder="Street address" value={data.street} onChange={(e) => update({ street: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <Input className={inputClass} placeholder="City" value={data.city} onChange={(e) => update({ city: e.target.value })} />
          <Input className={inputClass} placeholder="State" value={data.state} onChange={(e) => update({ state: e.target.value })} />
          <Input className={inputClass} placeholder="ZIP" value={data.zip} onChange={(e) => update({ zip: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Service Area</Label>
          <Input className={inputClass} placeholder="e.g., Nashville — 30mi radius" value={data.serviceArea} onChange={(e) => update({ serviceArea: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Year Established</Label>
          <Input className={inputClass} placeholder="e.g., 2015" value={data.yearEstablished} onChange={(e) => update({ yearEstablished: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">License Number</Label>
          <Input className={inputClass} placeholder="If applicable" value={data.licenseNumber} onChange={(e) => update({ licenseNumber: e.target.value })} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">We've pre-filled what we could from your signup. Update anything that needs changing.</p>
    </div>,

    // Step 3: Services & Description
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-heading font-bold">Services & Description</h2>
        <p className="text-sm text-muted-foreground">What does your business do?</p>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold">Industry:</span>
        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{data.industry}</span>
      </div>
      <div>
        <Label className="text-xs font-semibold mb-2 block">Services Offered</Label>
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
          {(INDUSTRY_SERVICES[data.industry] || INDUSTRY_SERVICES.Roofing).map((svc) => (
            <label key={svc} className="flex items-center gap-2 p-2 rounded-lg bg-card hover:bg-card-hover transition-colors cursor-pointer">
              <Checkbox checked={data.services.includes(svc)} onCheckedChange={() => toggleService(svc)} />
              <span className="text-sm">{svc}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          <Label className="text-xs font-semibold">Add Custom Service</Label>
          <div className="flex gap-2">
            <Input
              className={`${inputClass} flex-1`}
              placeholder="Type a service name..."
              value={customServiceInput}
              onChange={(e) => setCustomServiceInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomService(); } }}
            />
            <Button type="button" size="sm" onClick={addCustomService} disabled={!customServiceInput.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {data.customServices.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.customServices.map((svc) => (
                <span key={svc} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                  {svc}
                  <button type="button" onClick={() => removeCustomService(svc)} className="hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">About Your Business</Label>
        <Textarea
          className={`${inputClass} min-h-[100px]`}
          placeholder="Tell us what makes your business special. We'll use this on your website's About section."
          value={data.aboutText}
          onChange={(e) => update({ aboutText: e.target.value })}
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Not sure what to write? Cooper will help craft this for you.</span>
          <span>{data.aboutText.length}/500</span>
        </div>
      </div>
    </div>,

    // Step 4: Brand & Design
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-heading font-bold">Brand & Design</h2>
        <p className="text-sm text-muted-foreground">Make it yours — changes update the preview live</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Logo</Label>
            <div className="relative border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              {data.logo ? (
                <div className="flex items-center gap-3">
                  <img src={data.logo} alt="Logo" className="h-12 w-12 object-contain rounded" />
                  <span className="text-sm text-muted-foreground flex-1">Logo uploaded</span>
                  <button onClick={() => update({ logo: null })} className="p-1 rounded hover:bg-card"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Drop your logo or click to browse</p>
                  <p className="text-[10px] text-muted-light">PNG, JPG, SVG</p>
                  <input type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Don't have a logo? We'll create a text logo from your business name.</p>
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Primary Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => update({ primaryColor: c.value })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${data.primaryColor === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              <label className="w-8 h-8 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50">
                <span className="text-xs">+</span>
                <input type="color" className="hidden" value={data.primaryColor} onChange={(e) => update({ primaryColor: e.target.value })} />
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">Used for buttons, headings, and accents</p>
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Secondary Color</Label>
            <div className="flex items-center gap-3">
              <label className="w-8 h-8 rounded-lg border-2 border-border cursor-pointer" style={{ backgroundColor: data.secondaryColor }}>
                <input type="color" className="hidden" value={data.secondaryColor} onChange={(e) => update({ secondaryColor: e.target.value })} />
              </label>
              <span className="text-xs text-muted-foreground">Used for backgrounds and highlights</span>
            </div>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Font Style</Label>
            <div className="space-y-2">
              {FONT_OPTIONS.map((f) => (
                <label key={f.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${data.fontStyle === f.id ? "bg-primary/10 border border-primary/30" : "bg-card hover:bg-card-hover border border-transparent"}`}>
                  <input type="radio" name="font" className="hidden" checked={data.fontStyle === f.id} onChange={() => update({ fontStyle: f.id })} />
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: f.fonts }}>{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="hidden lg:block">
          <Label className="text-xs font-semibold mb-2 block">Live Preview</Label>
          <MiniPreview data={data} />
        </div>
      </div>
      {/* Mobile preview */}
      <div className="lg:hidden">
        <Label className="text-xs font-semibold mb-2 block">Preview</Label>
        <MiniPreview data={data} />
      </div>
    </div>,

    // Step 5: Connect Google
    <div className="text-center space-y-6">
      <h2 className="text-xl md:text-2xl font-heading font-bold">Connect your Google account</h2>
      <p className="text-muted-foreground max-w-md mx-auto text-sm">
        This lets us manage your Google Business Profile, track your search rankings, and run ads. You can skip this and do it later.
      </p>
      {googleError && (
        <div className="max-w-md mx-auto p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {googleError}
        </div>
      )}
      {data.googleConnected ? (
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 p-4 rounded-lg bg-success/10 text-success">
            <Check className="w-5 h-5" />
            <span className="font-semibold text-sm">Connected as {data.googleEmail}</span>
          </div>

          {/* Business Selection */}
          <div className="max-w-md mx-auto text-left space-y-3">
            <div>
              <h3 className="font-heading font-bold text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Select Your Business
              </h3>
              {googleBusinesses.length > 0 ? (
                <p className="text-xs text-muted-foreground mt-0.5">We found these businesses on your Google account. Pick the one you'd like to connect to Skooped.</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">No Google Business Profile listings were found on this account. You can skip for now and connect later.</p>
              )}
            </div>
            {googleBusinesses.length > 0 && (
              <div className="space-y-2">
                {googleBusinesses.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => update({ selectedGoogleBusiness: biz.id })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      data.selectedGoogleBusiness === biz.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{biz.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{biz.address}</p>
                      </div>
                      {data.selectedGoogleBusiness === biz.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Button
          size="lg"
          variant="outline"
          className="px-6 gap-2"
          onClick={connectGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          )}
          {googleLoading ? "Connecting..." : "Connect Google Account"}
        </Button>
      )}
      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">We only request access to Google Search Console, Google Business Profile, and Google Analytics. We never access your Gmail, Drive, or personal data.</p>
    </div>,

    // Step 6: All Done
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto"
      >
        <Check className="w-10 h-10 text-success" strokeWidth={3} />
      </motion.div>
      <h2 className="text-2xl md:text-3xl font-heading font-bold">You're all set! 🎉</h2>
      <p className="text-muted-foreground max-w-md mx-auto">Your website is being built right now. Your AI team is already getting to work.</p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
        {data.plan} Plan selected
      </div>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto -mt-2">
        Your subscription will begin after your website is built. No charge until you approve.
      </p>
      <div className="max-w-xs mx-auto space-y-3 text-left">
        {[
          { done: true, text: "Account created" },
          { done: false, text: "", loading: true },
          { done: false, text: "SEO setup starting within 24 hours" },
          { done: false, text: "First social posts scheduled this week" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {item.done ? (
              <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center"><Check className="w-3 h-3 text-success-foreground" /></div>
            ) : item.loading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-border" />
            )}
            {item.loading ? (
              <CyclingText />
            ) : (
              <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.text}</span>
            )}
          </div>
        ))}
      </div>
      <Button size="lg" onClick={finish} className="px-8">
        Go to Your Dashboard <ExternalLink className="w-4 h-4 ml-1" />
      </Button>
    </div>,
  ];

  const isFirstStep = step === 0;
  const isLastStep = step === TOTAL_STEPS - 1;
  const isGoogleStep = step === 5;

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-2">
          <img src="/skooped-logo.svg" alt="Skooped" className="h-7" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="font-heading font-bold text-xl">Skooped</span>
        </div>
      </div>

      <div className="px-6 pb-6">
        <ProgressBar step={step} total={TOTAL_STEPS} />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-background rounded-xl border border-border p-6 md:p-8 shadow-sm"
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>

          {!isFirstStep && !isLastStep && (
            <div className="flex items-center justify-between mt-6">
              <button onClick={back} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
              <div className="flex gap-3">
                {isGoogleStep && !data.googleConnected && (
                  <button onClick={next} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Skip for now
                  </button>
                )}
                <Button onClick={next}>
                  {isGoogleStep ? (data.googleConnected ? "Continue" : "Next") : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
