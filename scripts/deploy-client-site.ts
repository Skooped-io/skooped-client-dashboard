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
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createProject, addDomain } from "../src/lib/vercelDeploy.js";
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
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );

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
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: "PUT",
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_metadata: patch }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase updateUserMetadata failed (${res.status}): ${body}`);
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Parse --userId argument
  const userIdIdx = process.argv.indexOf("--userId");
  if (userIdIdx === -1 || !process.argv[userIdIdx + 1]) {
    console.error("❌  Usage: npx tsx scripts/deploy-client-site.ts --userId <userId>");
    process.exit(1);
  }
  const userId = process.argv[userIdIdx + 1];

  console.log(`\n🚀 Starting deployment pipeline for user: ${userId}\n`);

  // ── Step 1: Fetch user + siteConfig ────────────────────────────────────────
  console.log("⏳ Fetching user from Supabase...");
  const user = await fetchUser(userId);
  const meta = user.user_metadata;

  // siteConfig may be stored as a nested object or flat on metadata
  const siteConfig =
    (meta.siteConfig as Record<string, unknown> | undefined) ?? meta;

  const template = (meta.template as string) ?? (siteConfig.template as string) ?? "";
  const businessName = (meta.business_name as string) ?? (siteConfig.businessName as string) ?? "";
  const ownerName = (meta.owner_name as string) ?? (meta.full_name as string) ?? (siteConfig.ownerName as string) ?? "";
  const email = user.email ?? "";

  console.log(`✅ Fetched user: ${email}`);
  console.log(`   Business: ${businessName || "(no business name)"}`);
  console.log(`   Template: ${template}`);

  // ── Step 2: Handle concierge/custom skip ───────────────────────────────────
  if (template === "custom" || template === "concierge") {
    console.log(
      `\nℹ️  Template is '${template}' — skipping automated deployment. A manual build is required.`
    );
    process.exit(0);
  }

  // ── Step 3: Build slug ─────────────────────────────────────────────────────
  const slugSource = businessName || ownerName || email.split("@")[0];
  const slug = slugify(slugSource);
  if (!slug) {
    throw new Error("Could not derive a slug from business name, owner name, or email.");
  }
  console.log(`\n✅ Slug: ${slug}`);

  // ── Step 4: Resolve template repo ─────────────────────────────────────────
  const templateRepo = TEMPLATE_REPO_MAP[template];
  if (!templateRepo) {
    throw new Error(
      `Unknown template '${template}'. Add it to TEMPLATE_REPO_MAP or mark as 'concierge'.`
    );
  }
  const templateRepoFull = `${GITHUB_ORG}/${templateRepo}`;
  console.log(`✅ Template repo: ${templateRepoFull}`);

  // ── Step 5: Clone template into a temp dir ─────────────────────────────────
  const tmpDir = mkdtempSync(join(tmpdir(), "skooped-deploy-"));
  const cloneDir = join(tmpDir, "site");

  try {
    console.log(`\n⏳ Cloning ${templateRepoFull}...`);
    gh(`repo clone ${templateRepoFull} ${cloneDir}`);
    console.log("✅ Cloned template");

    // ── Step 6: Remove GitHub Actions workflows ──────────────────────────────
    const workflowsDir = join(cloneDir, ".github");
    if (existsSync(workflowsDir)) {
      rmSync(workflowsDir, { recursive: true, force: true });
      console.log("✅ Removed .github/workflows");
    }

    // ── Step 7: Inject siteConfig.json ──────────────────────────────────────
    const siteConfigPath = join(cloneDir, "siteConfig.json");
    writeFileSync(siteConfigPath, JSON.stringify(siteConfig, null, 2), "utf-8");
    console.log("✅ Config injected");

    // ── Step 7.5: Remove old git remote + reinitialize ──────────────────────
    git("remote remove origin", cloneDir);
    console.log("✅ Removed old origin remote");

    // ── Step 8: Create new GitHub repo ──────────────────────────────────────
    const newRepoName = `site-${slug}`;
    const newRepoFull = `${GITHUB_ORG}/${newRepoName}`;

    console.log(`\n⏳ Creating GitHub repo: ${newRepoFull}...`);
    gh(`repo create ${newRepoFull} --private --source ${cloneDir} --push`);
    console.log(`✅ Repo created: ${newRepoFull}`);

    // ── Step 9: Create Vercel project ────────────────────────────────────────
    const vercelProjectName = `skooped-${slug}`;
    console.log(`\n⏳ Creating Vercel project: ${vercelProjectName}...`);
    const projectId = await createProject(vercelProjectName, newRepoFull, VERCEL_TOKEN!);
    console.log(`✅ Vercel project created: ${projectId}`);

    // ── Step 10: Add custom domain ───────────────────────────────────────────
    const domain = `${slug}.skooped.io`;
    console.log(`\n⏳ Adding custom domain: ${domain}...`);
    await addDomain(projectId, domain, VERCEL_TOKEN!);
    console.log(`✅ Domain added: ${domain}`);

    // ── Step 11: Save deployment info back to Supabase ───────────────────────
    console.log(`\n⏳ Saving deployment info to Supabase...`);
    const deployedUrl = `https://${domain}`;
    const updatedMeta: Record<string, unknown> = {
      ...meta,
      siteConfig: {
        ...siteConfig,
      },
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
    // Clean up tmp dir on failure
    rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }

  // Clean up tmp dir on success
  rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((err: Error) => {
  console.error(`\n❌ Deployment failed: ${err.message}`);
  process.exit(1);
});
