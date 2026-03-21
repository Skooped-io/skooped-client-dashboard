import { supabase } from "./supabase";

export interface SkoopedSiteConfig {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  serviceArea: string;
  yearEstablished: string;
  licenseNumber: string;
  industry: string;
  services: string[];
  aboutText: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    fontStyle: string;
    logoUrl: string | null;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  template: string;
  plan: string;
  googleBusinessId: string | null;
}

type UserMetadata = Record<string, unknown>;

export function buildSiteConfig(userData: UserMetadata): SkoopedSiteConfig {
  const businessName = (userData.business_name as string) || "";
  const industry = (userData.industry as string) || "";
  const city = (userData.city as string) || "";
  const state = (userData.state as string) || "";
  const services = (userData.services as string[]) || [];

  const locationStr = [city, state].filter(Boolean).join(", ");

  const seoTitle = businessName
    ? `${businessName} | ${industry} Services${locationStr ? ` in ${locationStr}` : ""}`
    : `${industry} Services${locationStr ? ` in ${locationStr}` : ""}`;

  const seoDescription = businessName
    ? `${businessName} provides professional ${industry.toLowerCase()} services${locationStr ? ` in ${locationStr}` : ""}. Contact us today for a free estimate.`
    : `Professional ${industry.toLowerCase()} services${locationStr ? ` in ${locationStr}` : ""}. Contact us today.`;

  const keywords = [
    industry.toLowerCase(),
    ...services.slice(0, 5).map((s) => s.toLowerCase()),
    ...(city ? [city.toLowerCase()] : []),
    ...(state ? [state.toLowerCase()] : []),
    ...(businessName ? [businessName.toLowerCase()] : []),
  ].filter(Boolean);

  return {
    businessName,
    ownerName: (userData.owner_name as string) || (userData.full_name as string) || "",
    phone: (userData.phone as string) || "",
    email: (userData.email as string) || "",
    address: {
      street: (userData.street as string) || "",
      city,
      state,
      zip: (userData.zip as string) || "",
    },
    serviceArea: (userData.service_area as string) || "",
    yearEstablished: (userData.year_established as string) || "",
    licenseNumber: (userData.license_number as string) || "",
    industry,
    services,
    aboutText: (userData.about_text as string) || "",
    branding: {
      primaryColor: (userData.primary_color as string) || "#DC2626",
      secondaryColor: (userData.secondary_color as string) || "#F3F4F6",
      fontStyle: (userData.font_style as string) || "modern",
      logoUrl: (userData.logo_url as string | null) || null,
    },
    seo: {
      title: seoTitle,
      description: seoDescription,
      keywords,
    },
    template: (userData.template as string) || "Roofing",
    plan: (userData.plan as string) || "Growth",
    googleBusinessId: (userData.google_business_id as string | null) || null,
  };
}

export async function saveSiteConfig(userId: string, config: SkoopedSiteConfig): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { siteConfig: config },
  });
  if (error) {
    console.error("Failed to save site config:", error.message);
    throw error;
  }
}
