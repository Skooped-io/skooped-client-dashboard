/**
 * Skooped "Live in 60 Seconds" Deployment Pipeline
 *
 * Fetches a client's siteConfig from Supabase, clones the matching template
 * repo, injects their config, creates a new GitHub repo, links it to Vercel,
 * adds a custom subdomain, and saves the result back to Supabase.
 *
 * Usage:
 *   VERCEL_TOKEN=... SUPABASE_SERVICE_KEY=... npx tsx scripts/deploy-client-site.ts --userId <userId>
 *
 * Required env vars:
 *   VERCEL_TOKEN         — Vercel personal access token
 *   SUPABASE_URL         — https://ordxzakffddgytanahnc.supabase.co
 *   SUPABASE_SERVICE_KEY — Supabase service role key
 *   GITHUB_TOKEN         — GitHub PAT (or rely on `gh` CLI auth)
 */

import { execSync } from "child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createProject, addDomain, getDeploymentStatus } from "../src/lib/vercelDeploy.js";
import { slugify } from "../src/lib/slugify.js";

// ─── Environment ──────────────────────────────────────────────────────────────

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://ordxzakffddgytanahnc.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GITHUB_ORG = "Skooped-io";

if (!VERCEL_TOKEN) {
  console.error("❌  VERCEL_TOKEN env var is required.");
  process.exit(1);
}
if (!SUPABASE_SERVICE_KEY) {
  console.error("❌  SUPABASE_SERVICE_KEY env var is required.");
  process.exit(1);
}

// ─── Template mapping ─────────────────────────────────────────────────────────

const TEMPLATE_REPO_MAP: Record<string, string> = {
  Roofing: "roofing-template",
  Landscaping: "landscaping-template",
  Fencing: "fencing-template",
  Therapy: "therapy-template",
  Construction: "construction-template",
  AutoRepair: "auto-repair-template",
  LifeCoaching: "life-coaching-template",
  RealEstate: "real-estate-agent-template",
  PersonalTraining: "personal-training-template",
  Salon: "salon-barber-shop-template",
  Plumbing: "plumbing-template",
  Electrical: "electrical-template",
};

// ─── Supabase helpers ─────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}

async function fetchUser(userId: string): Promise<UserRecord> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase fetchUser failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<UserRecord>;
}

async function updateUserMetadata(
  userId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_metadata: patch }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Supabase updateUserMetadata failed (${res.status}): ${body}`
    );
  }
}

// ─── GitHub helpers ───────────────────────────────────────────────────────────

function gh(args: string, cwd?: string): string {
  return execSync(`gh ${args}`, {
    cwd,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function git(args: string, cwd: string): string {
  return execSync(`git ${args}`, {
    cwd,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

// ─── Config builder ───────────────────────────────────────────────────────────

interface SiteAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface SiteBranding {
  primaryColor: string;
  secondaryColor: string;
  fontStyle: string;
}

interface SiteConfig {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: SiteAddress;
  serviceArea: string;
  industry: string;
  services: unknown[];
  about: string;
  branding: SiteBranding;
  yearEstablished: unknown;
  licenseNumber: unknown;
  template?: string;
  [key: string]: unknown;
}

/**
 * Builds a normalized siteConfig from user metadata.
 * Uses the nested siteConfig object if present and populated;
 * otherwise falls back to flat metadata fields.
 */
function buildSiteConfig(
  meta: Record<string, unknown>,
  userEmail: string
): SiteConfig {
  const existing = meta.siteConfig as Record<string, unknown> | undefined;
  const hasSiteConfig =
    existing && typeof existing === "object" && Object.keys(existing).length > 3;

  if (hasSiteConfig) {
    return existing as SiteConfig;
  }

  const businessName =
    (meta.business_name as string) ?? "";
  const ownerName =
    (meta.owner_name as string) ?? (meta.full_name as string) ?? "";
  const city = (meta.city as string) ?? "";
  const state = (meta.state as string) ?? "";
  const industry = (meta.industry as string) ?? "";

  return {
    businessName,
    ownerName,
    phone: (meta.phone as string) ?? "",
    email: (meta.email as string) ?? userEmail,
    address: {
      street: (meta.street as string) ?? "",
      city,
      state,
      zip: (meta.zip as string) ?? "",
    },
    serviceArea: (meta.service_area as string) ?? [city, state].filter(Boolean).join(", "),
    industry,
    services: (meta.services as unknown[]) ?? [],
    about: (meta.about_text as string) ?? "",
    branding: {
      primaryColor: (meta.primary_color as string) ?? "#DC2626",
      secondaryColor: (meta.secondary_color as string) ?? "#F3F4F6",
      fontStyle: (meta.font_style as string) ?? "modern",
    },
    yearEstablished: meta.year_established ?? "",
    licenseNumber: meta.license_number ?? "",
    template: (meta.template as string) ?? "",
  };
}

// ─── FAQ & content generators ─────────────────────────────────────────────────

function generateFaqs(
  industry: string,
  businessName: string,
  city: string,
  state: string
): Array<{ q: string; a: string }> {
  const ind = industry.toLowerCase();
  return [
    {
      q: `What ${ind} services does ${businessName} offer?`,
      a: `We offer a full range of ${ind} services in ${city}, ${state}. Contact us to learn more about what we can do for you.`,
    },
    {
      q: "How much do your services cost?",
      a: "Pricing varies by project scope and materials. We offer free, no-obligation estimates — contact us today.",
    },
    {
      q: "Are you licensed and insured?",
      a: "Yes, we are fully licensed and insured, giving you complete peace of mind throughout your project.",
    },
    {
      q: "What areas do you serve?",
      a: `We primarily serve ${city}, ${state} and the surrounding communities.`,
    },
    {
      q: "How quickly can you start a project?",
      a: "We typically schedule new projects within 1–2 weeks of the initial consultation, depending on availability.",
    },
    {
      q: "Do you offer free estimates?",
      a: "Absolutely! We provide free, no-obligation estimates for all projects. Reach out to get started.",
    },
  ];
}

function generateTestimonials(
  industry: string,
  city: string
): Array<{ name: string; text: string; rating: number }> {
  const ind = industry.toLowerCase();
  return [
    {
      name: "Sarah M.",
      text: `Outstanding ${ind} work! The team was professional, on time, and the results exceeded our expectations. Highly recommend!`,
      rating: 5,
    },
    {
      name: "James T.",
      text: `Incredible experience from start to finish. They were courteous, efficient, and did excellent work. Will definitely use again.`,
      rating: 5,
    },
    {
      name: "Linda R.",
      text: `Best ${ind} company in ${city}. Honest pricing, great communication, and top-quality work. You won't be disappointed.`,
      rating: 5,
    },
  ];
}

// ─── Schema transformer ───────────────────────────────────────────────────────

/**
 * Transforms a siteConfig to match the shape templates expect,
 * filling in missing fields with sensible defaults.
 */
function transformConfig(config: SiteConfig): Record<string, unknown> {
  const { businessName, ownerName, industry } = config;
  const city = config.address?.city ?? "";
  const state = config.address?.state ?? "";
  const ind = industry?.toLowerCase() ?? "";

  // ── a) services ────────────────────────────────────────────────────────────
  let services: unknown[] = config.services ?? [];
  if (
    Array.isArray(services) &&
    services.length > 0 &&
    typeof services[0] === "string"
  ) {
    services = (services as string[]).map((name, i) => ({
      title: name,
      shortDesc: `Professional ${name} services in ${city}, ${state}.`,
      longDesc: `Contact us for quality ${name} services. We serve ${city} and the surrounding area.`,
      icon: "Wrench",
      imageSlot: `service_${i + 1}`,
    }));
  }

  // ── b) trustItems ──────────────────────────────────────────────────────────
  const defaultTrustItems = [
    "Licensed & Insured",
    "5-Star Rated",
    "Free Estimates",
    "Locally Owned",
  ];
  let trustItems: unknown = config.trustItems;
  if (!Array.isArray(trustItems) || trustItems.length === 0) {
    trustItems = defaultTrustItems;
  } else if (
    typeof (trustItems as unknown[])[0] === "object" &&
    (trustItems as Array<{ label?: string }>)[0]?.label !== undefined
  ) {
    trustItems = (trustItems as Array<{ label: string }>).map((t) => t.label);
  }

  // ── c) faqs ────────────────────────────────────────────────────────────────
  let faqs: unknown = config.faqs;
  if (!Array.isArray(faqs) || faqs.length === 0) {
    faqs = generateFaqs(industry, businessName, city, state);
  } else {
    faqs = (faqs as Array<Record<string, string>>).map((f) => ({
      q: f.q ?? f.question,
      a: f.a ?? f.answer,
    }));
  }

  // ── d) testimonials ────────────────────────────────────────────────────────
  let testimonials: unknown = config.testimonials;
  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    testimonials = generateTestimonials(industry, city);
  }

  // ── e) gallery ─────────────────────────────────────────────────────────────
  let gallery: unknown = config.gallery;
  if (!Array.isArray(gallery) || gallery.length === 0) {
    gallery = Array.from({ length: 6 }, (_, i) => ({
      title: `Project ${i + 1}`,
      imageSlot: `gallery_${i + 1}`,
    }));
  }

  // ── f) team ────────────────────────────────────────────────────────────────
  let team: unknown = config.team;
  if (!Array.isArray(team) || team.length === 0) {
    team = [
      {
        name: ownerName || businessName,
        role: "Owner",
        imageSlot: "team_1",
      },
    ];
  }

  // ── g) missing fields with defaults ───────────────────────────────────────
  const tagline =
    config.tagline ?? `${industry} Services You Can Trust`;

  const mission =
    config.mission ??
    `Our mission is to deliver quality ${ind} services to the ${city} area with professionalism and care.`;

  const hours = config.hours ?? {
    monday: "8:00 AM - 6:00 PM",
    tuesday: "8:00 AM - 6:00 PM",
    wednesday: "8:00 AM - 6:00 PM",
    thursday: "8:00 AM - 6:00 PM",
    friday: "8:00 AM - 6:00 PM",
    saturday: "9:00 AM - 4:00 PM",
    sunday: "Closed",
  };

  const whyChooseUs = config.whyChooseUs ?? [
    "Experienced & Professional",
    "Licensed & Insured",
    "Customer Satisfaction Guaranteed",
    "Serving the Local Community",
  ];

  const certifications = config.certifications ?? [];
  const process = config.process ?? [];
  const serviceOptions = config.serviceOptions ?? [];
  const serviceAreaCities =
    config.serviceAreaCities ?? (city ? [city] : []);

  // ── Auto-generate SEO fields ───────────────────────────────────────────────
  const seoHomeTitle = `${businessName} | ${industry} in ${city}, ${state}`;
  const seoHomeDesc = `${businessName} offers professional ${ind} services in ${city}, ${state}. Call us for a free estimate today.`;

  const seo = config.seo ?? {
    home: {
      title: seoHomeTitle,
      description: seoHomeDesc,
    },
    about: {
      title: `About ${businessName} | ${industry} in ${city}, ${state}`,
      description: `Learn more about ${businessName}, your trusted ${ind} provider in ${city}, ${state}.`,
    },
    contact: {
      title: `Contact ${businessName} | ${industry} in ${city}, ${state}`,
      description: `Get in touch with ${businessName} for ${ind} services in ${city}, ${state}.`,
    },
    services: {
      title: `${industry} Services | ${businessName}`,
      description: `Explore the full range of ${ind} services offered by ${businessName} in ${city}, ${state}.`,
    },
  };

  return {
    ...config,
    services,
    trustItems,
    faqs,
    testimonials,
    gallery,
    team,
    tagline,
    mission,
    hours,
    whyChooseUs,
    certifications,
    process,
    serviceOptions,
    serviceAreaCities,
    seo,
  };
}

// ─── GitHub Pages artifact stripping ─────────────────────────────────────────

function stripGithubPagesArtifacts(cloneDir: string): void {
  console.log("\n⏳ Stripping GitHub Pages artifacts...");

  // a) Remove public/404.html
  const notFoundPage = join(cloneDir, "public", "404.html");
  if (existsSync(notFoundPage)) {
    rmSync(notFoundPage);
    console.log("  ✅ Removed public/404.html");
  }

  // b) Remove SPA redirect script from index.html
  const indexHtmlPath = join(cloneDir, "index.html");
  if (existsSync(indexHtmlPath)) {
    let html = readFileSync(indexHtmlPath, "utf-8");
    const before = html;
    // Remove <script> blocks containing GitHub Pages SPA redirect logic
    html = html.replace(
      /<script>[\s\S]*?(?:~and~|SPA redirect|sessionStorage\.redirect)[\s\S]*?<\/script>\s*\n?/gi,
      ""
    );
    if (html !== before) {
      writeFileSync(indexHtmlPath, html, "utf-8");
      console.log("  ✅ Removed SPA redirect script from index.html");
    }
  }

  // c) Fix vite.config.ts base from '/template-name/' to '/'
  const viteConfigPath = join(cloneDir, "vite.config.ts");
  if (existsSync(viteConfigPath)) {
    let viteConfig = readFileSync(viteConfigPath, "utf-8");
    const before = viteConfig;
    viteConfig = viteConfig.replace(/base:\s*['"][^'"]+['"]/g, "base: '/'");
    if (viteConfig !== before) {
      writeFileSync(viteConfigPath, viteConfig, "utf-8");
      console.log("  ✅ Fixed vite.config.ts base to '/'");
    }
  }

  // d) Swap HashRouter → BrowserRouter in src/App.tsx
  const appTsxPath = join(cloneDir, "src", "App.tsx");
  if (existsSync(appTsxPath)) {
    let appTsx = readFileSync(appTsxPath, "utf-8");
    if (appTsx.includes("HashRouter")) {
      appTsx = appTsx.replace(/HashRouter/g, "BrowserRouter");
      writeFileSync(appTsxPath, appTsx, "utf-8");
      console.log("  ✅ Swapped HashRouter → BrowserRouter in App.tsx");
    }
  }

  // e) Create vercel.json with SPA rewrite rule
  const vercelJsonPath = join(cloneDir, "vercel.json");
  writeFileSync(
    vercelJsonPath,
    JSON.stringify(
      { rewrites: [{ source: "/(.*)", destination: "/index.html" }] },
      null,
      2
    ) + "\n",
    "utf-8"
  );
  console.log("  ✅ Created vercel.json");
}

// ─── index.html meta tag fixer ────────────────────────────────────────────────

function fixIndexHtmlMetaTags(
  cloneDir: string,
  seoTitle: string,
  seoDescription: string,
  businessName: string
): void {
  const indexHtmlPath = join(cloneDir, "index.html");
  if (!existsSync(indexHtmlPath)) return;

  let html = readFileSync(indexHtmlPath, "utf-8");

  // Replace <title>...</title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${seoTitle}</title>`);

  // Replace meta description
  html = html.replace(
    /(<meta\s+name=["']description["']\s+content=["'])[^"']*(['"])/gi,
    `$1${seoDescription}$2`
  );
  html = html.replace(
    /(<meta\s+content=["'])[^"']*(['"][^>]*name=["']description["'])/gi,
    `$1${seoDescription}$2`
  );

  // Replace meta author
  html = html.replace(
    /(<meta\s+name=["']author["']\s+content=["'])[^"']*(['"])/gi,
    `$1${businessName}$2`
  );
  html = html.replace(
    /(<meta\s+content=["'])[^"']*(['"][^>]*name=["']author["'])/gi,
    `$1${businessName}$2`
  );

  // Replace og:title
  html = html.replace(
    /(<meta\s+property=["']og:title["']\s+content=["'])[^"']*(['"])/gi,
    `$1${seoTitle}$2`
  );
  html = html.replace(
    /(<meta\s+content=["'])[^"']*(['"][^>]*property=["']og:title["'])/gi,
    `$1${seoTitle}$2`
  );

  // Replace og:description
  html = html.replace(
    /(<meta\s+property=["']og:description["']\s+content=["'])[^"']*(['"])/gi,
    `$1${seoDescription}$2`
  );

  writeFileSync(indexHtmlPath, html, "utf-8");
  console.log("  ✅ Fixed index.html meta tags");
}

// ─── Navbar / Footer logo fixer ───────────────────────────────────────────────

/**
 * Finds hardcoded business-name-like text in brand spans within a component
 * file and replaces it with {siteConfig.businessName}.
 * Adds the siteConfig import if not already present.
 */
function fixHardcodedLogo(filePath: string): void {
  if (!existsSync(filePath)) return;

  let content = readFileSync(filePath, "utf-8");
  const original = content;

  // Match spans with brand/logo/font-bold/text-xl/text-2xl/text-3xl class names
  // whose text content is a hardcoded string (not already a JSX expression)
  const brandSpanRe =
    /(<span\b[^>]*className\s*=\s*(?:"[^"]*(?:font-bold|text-xl|text-2xl|text-3xl|logo|brand)[^"]*"|`[^`]*(?:font-bold|text-xl|text-2xl|text-3xl|logo|brand)[^`]*`)[^>]*>)([^{<][^<]*)(<\/span>)/g;

  content = content.replace(brandSpanRe, (match, open, text, close) => {
    const trimmed = text.trim();
    // Only replace if it looks like a proper business name (starts with uppercase, 2+ chars)
    if (trimmed.length >= 2 && /^[A-Z]/.test(trimmed)) {
      return `${open}{siteConfig.businessName}${close}`;
    }
    return match;
  });

  if (content === original) return;

  // Add siteConfig import if not already present
  if (!content.includes("siteConfig")) {
    // Insert after the last existing import line
    content = content.replace(
      /(^(?:import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+)/m,
      `$1import siteConfig from "../../siteConfig.json";\n`
    );
  }

  writeFileSync(filePath, content, "utf-8");
  console.log(`  ✅ Fixed hardcoded logo in ${filePath.split("/").pop()}`);
}

// ─── Vercel deployment poller ─────────────────────────────────────────────────

async function pollDeploymentReady(
  projectId: string,
  token: string,
  timeoutMs = 120_000
): Promise<void> {
  const pollInterval = 5_000;
  const deadline = Date.now() + timeoutMs;

  console.log("\n⏳ Polling Vercel for deployment to become READY...");

  while (Date.now() < deadline) {
    const status = await getDeploymentStatus(projectId, token);
    console.log(`   Deployment status: ${status}`);

    if (status === "READY") {
      console.log("  ✅ Vercel deployment is READY");
      return;
    }
    if (status === "ERROR" || status === "CANCELED") {
      throw new Error(`Vercel deployment failed with state: ${status}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  console.warn(
    `  ⚠️  Deployment did not reach READY within ${timeoutMs / 1000}s — continuing anyway.`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Parse --userId argument
  const userIdIdx = process.argv.indexOf("--userId");
  if (userIdIdx === -1 || !process.argv[userIdIdx + 1]) {
    console.error(
      "❌  Usage: npx tsx scripts/deploy-client-site.ts --userId <userId>"
    );
    process.exit(1);
  }
  const userId = process.argv[userIdIdx + 1];

  console.log(`\n🚀 Starting deployment pipeline for user: ${userId}\n`);

  // ── Step 1: Fetch user + build siteConfig ───────────────────────────────────
  console.log("⏳ Fetching user from Supabase...");
  const user = await fetchUser(userId);
  const meta = user.user_metadata;
  const userEmail = user.email ?? "";

  const rawConfig = buildSiteConfig(meta, userEmail);
  const siteConfig = transformConfig(rawConfig) as Record<string, unknown> & {
    businessName: string;
    ownerName: string;
    industry: string;
    address: SiteAddress;
    seo: { home: { title: string; description: string } };
  };

  const template =
    (meta.template as string) ?? (rawConfig.template as string) ?? "";
  const { businessName } = siteConfig;
  const seoTitle = (siteConfig.seo as any)?.home?.title ?? businessName;
  const seoDescription = (siteConfig.seo as any)?.home?.description ?? "";

  console.log(`✅ Fetched user: ${userEmail}`);
  console.log(`   Business: ${businessName || "(no business name)"}`);
  console.log(`   Template: ${template}`);

  // ── Step 2: Handle concierge / custom skip ──────────────────────────────────
  if (template === "custom" || template === "concierge") {
    console.log(
      `\nℹ️  Template is '${template}' — skipping automated deployment. A manual build is required.`
    );
    process.exit(0);
  }

  // ── Step 3: Build slug ──────────────────────────────────────────────────────
  const ownerName = siteConfig.ownerName as string;
  const slugSource = businessName || ownerName || userEmail.split("@")[0];
  const slug = slugify(slugSource);
  if (!slug) {
    throw new Error(
      "Could not derive a slug from business name, owner name, or email."
    );
  }
  console.log(`\n✅ Slug: ${slug}`);

  // ── Step 4: Resolve template repo ──────────────────────────────────────────
  const templateRepo = TEMPLATE_REPO_MAP[template];
  if (!templateRepo) {
    throw new Error(
      `Unknown template '${template}'. Add it to TEMPLATE_REPO_MAP or mark as 'concierge'.`
    );
  }
  const templateRepoFull = `${GITHUB_ORG}/${templateRepo}`;
  console.log(`✅ Template repo: ${templateRepoFull}`);

  // ── Step 5: Clone template into a temp dir ──────────────────────────────────
  const tmpDir = mkdtempSync(join(tmpdir(), "skooped-deploy-"));
  const cloneDir = join(tmpDir, "site");

  try {
    console.log(`\n⏳ Cloning ${templateRepoFull}...`);
    gh(`repo clone ${templateRepoFull} ${cloneDir}`);
    console.log("✅ Cloned template");

    // ── Step 6: Remove GitHub Actions workflows ─────────────────────────────
    const workflowsDir = join(cloneDir, ".github");
    if (existsSync(workflowsDir)) {
      rmSync(workflowsDir, { recursive: true, force: true });
      console.log("✅ Removed .github/workflows");
    }

    // ── Step 6.5: Strip GitHub Pages artifacts ──────────────────────────────
    stripGithubPagesArtifacts(cloneDir);

    // ── Step 7: Fix index.html meta tags ────────────────────────────────────
    console.log("\n⏳ Fixing index.html meta tags...");
    fixIndexHtmlMetaTags(cloneDir, seoTitle, seoDescription, businessName);

    // ── Step 7.5: Fix hardcoded Navbar / Footer logos ───────────────────────
    console.log("\n⏳ Checking Navbar/Footer for hardcoded logos...");
    fixHardcodedLogo(join(cloneDir, "src", "components", "Navbar.tsx"));
    fixHardcodedLogo(join(cloneDir, "src", "components", "Footer.tsx"));

    // ── Step 8: Inject siteConfig.json ──────────────────────────────────────
    const siteConfigPath = join(cloneDir, "siteConfig.json");
    writeFileSync(
      siteConfigPath,
      JSON.stringify(siteConfig, null, 2) + "\n",
      "utf-8"
    );
    console.log("\n✅ siteConfig.json injected");

    // ── Step 8.5: Remove old git remote ─────────────────────────────────────
    git("remote remove origin", cloneDir);
    console.log("✅ Removed old origin remote");

    // ── Step 9: Create new private GitHub repo ──────────────────────────────
    const newRepoName = `site-${slug}`;
    const newRepoFull = `${GITHUB_ORG}/${newRepoName}`;

    console.log(`\n⏳ Creating private GitHub repo: ${newRepoFull}...`);
    gh(`repo create ${newRepoFull} --private --source ${cloneDir} --push`);
    console.log(`✅ Repo created: ${newRepoFull}`);

    // ── Step 10: Create Vercel project ───────────────────────────────────────
    const vercelProjectName = `skooped-${slug}`;
    console.log(`\n⏳ Creating Vercel project: ${vercelProjectName}...`);
    const projectId = await createProject(
      vercelProjectName,
      newRepoFull,
      VERCEL_TOKEN!
    );
    console.log(`✅ Vercel project created: ${projectId}`);

    // ── Step 10.5: Push empty commit to trigger initial build ────────────────
    console.log("\n⏳ Pushing empty commit to trigger initial Vercel build...");
    git(
      'commit --allow-empty -m "chore: trigger initial vercel deployment"',
      cloneDir
    );
    git("push", cloneDir);
    console.log("✅ Empty commit pushed");

    // ── Step 10.6: Poll until deployment is READY ────────────────────────────
    await pollDeploymentReady(projectId, VERCEL_TOKEN!);

    // ── Step 11: Add custom domain ───────────────────────────────────────────
    const domain = `${slug}.skooped.io`;
    console.log(`\n⏳ Adding custom domain: ${domain}...`);
    await addDomain(projectId, domain, VERCEL_TOKEN!);
    console.log(`✅ Domain added: ${domain}`);

    // ── Step 12: Save deployment info back to Supabase ───────────────────────
    console.log(`\n⏳ Saving deployment info to Supabase...`);
    const deployedUrl = `https://${domain}`;
    const updatedMeta: Record<string, unknown> = {
      ...meta,
      siteConfig,
      deployed_url: deployedUrl,
      deployed_repo: newRepoFull,
      vercel_project_id: projectId,
      deployment_slug: slug,
    };

    await updateUserMetadata(userId, updatedMeta);
    console.log(`✅ Deployment info saved to Supabase`);

    console.log(`\n🎉 Deployment complete!`);
    console.log(`   URL:  ${deployedUrl}`);
    console.log(`   Repo: https://github.com/${newRepoFull}`);
    console.log(`   Vercel project ID: ${projectId}\n`);
  } catch (err) {
    rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }

  rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((err: Error) => {
  console.error(`\n❌ Deployment failed: ${err.message}`);
  process.exit(1);
});
