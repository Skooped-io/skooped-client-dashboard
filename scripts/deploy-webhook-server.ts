/**
 * Skooped Deploy Server — Full Onboarding Pipeline
 * 
 * Handles the complete post-checkout flow:
 * 1. Fetch user from Supabase
 * 2. Send welcome email via Resend
 * 3. Notify Slack #coopers-hub
 * 4. Run deploy pipeline (clone template, inject config, deploy to Vercel)
 * 5. Send "site is live" email
 * 6. Notify Slack with deployed URL
 *
 * Runs on Render: https://skooped-deploy.onrender.com
 * Dashboard calls: POST /deploy { "userId": "..." }
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { execSync } from "child_process";

const PORT = parseInt(process.env.PORT ?? "3456", 10);
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://ordxzakffddgytanahnc.supabase.co";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DEPLOY_SERVER_SECRET = process.env.DEPLOY_SERVER_SECRET;
const SLACK_CHANNEL = "C0ALGCT1E4B";

if (!VERCEL_TOKEN || !SUPABASE_SERVICE_KEY) {
  console.error("❌ VERCEL_TOKEN and SUPABASE_SERVICE_KEY env vars required");
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
  });
}

async function fetchUser(userId: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase fetchUser failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch business profile from the portal's business_profiles table.
 * The portal onboarding writes here (not user_metadata).
 */
async function fetchBusinessProfile(userId: string) {
  // First get the org_id for this user
  const orgRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organization_members?user_id=eq.${userId}&select=org_id&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!orgRes.ok) throw new Error(`Supabase org lookup failed: ${orgRes.status}`);
  const orgRows = await orgRes.json();
  if (!orgRows.length) return null;

  const orgId = orgRows[0].org_id;

  // Then fetch the business profile for that org
  const bpRes = await fetch(
    `${SUPABASE_URL}/rest/v1/business_profiles?org_id=eq.${orgId}&select=*&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!bpRes.ok) throw new Error(`Supabase business_profiles fetch failed: ${bpRes.status}`);
  const bpRows = await bpRes.json();
  return bpRows.length ? bpRows[0] : null;
}

/**
 * Write to Supabase tables via REST API (service role bypasses RLS).
 */
async function supabaseInsert(table: string, row: Record<string, unknown>) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      console.warn(`⚠️ Supabase insert to ${table} failed: ${res.status}`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Supabase insert to ${table} error: ${err.message}`);
  }
}

async function getOrgId(userId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/organization_members?user_id=eq.${userId}&select=org_id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.org_id ?? null;
  } catch {
    return null;
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) { console.log("⚠️ RESEND_API_KEY not set, skipping email"); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Skooped <noreply@skooped.io>",
      to: [to],
      subject,
      html,
    }),
  });
  const data = await res.json();
  console.log(`📧 Email sent: ${subject} → ${to} (${(data as any).id ?? "ok"})`);
}

async function notifySlack(text: string) {
  if (!SLACK_BOT_TOKEN) { console.log("⚠️ SLACK_BOT_TOKEN not set, skipping slack"); return; }
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
  });
  console.log(`💬 Slack notified`);
}

// ── Server ──────────────────────────────────────────────────────────

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok", service: "skooped-deploy" }));
    return;
  }

  // Stripe webhook endpoint (Option B: portal calls Render directly)
  if (req.method === "POST" && req.url === "/stripe-webhook") {
    // Redirect to /deploy — same logic, just a convenience alias
    req.url = "/deploy";
  }

  if (req.method !== "POST" || req.url !== "/deploy") {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // ── Auth check ──────────────────────────────────────────────────
  if (DEPLOY_SERVER_SECRET) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token !== DEPLOY_SERVER_SECRET) {
      console.error("🔒 Unauthorized deploy request");
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  try {
    const rawBody = await parseBody(req);
    const { userId } = JSON.parse(rawBody);

    if (!userId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "userId required" }));
      return;
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 FULL PIPELINE — userId: ${userId}`);
    console.log(`${"=".repeat(60)}\n`);

    // Respond immediately so dashboard doesn't hang
    res.writeHead(202, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ accepted: true, message: "Pipeline started" }));

    // ── Step 1: Fetch user + business profile ──────────────────────
    console.log("⏳ Step 1: Fetching user + business profile...");
    const user = await fetchUser(userId);
    const email = user.email;
    const meta = user.user_metadata ?? {};

    // Portal writes to business_profiles table; old dashboard wrote to user_metadata.
    // Try business_profiles first (portal), fall back to user_metadata (legacy).
    const bp = await fetchBusinessProfile(userId).catch((err: Error) => {
      console.warn("⚠️ business_profiles lookup failed, falling back to user_metadata:", err.message);
      return null;
    });

    const name = bp?.owner_name || bp?.business_name || meta.owner_name || meta.full_name || "there";
    const biz = bp?.business_name || meta.business_name || "your business";
    const template = bp?.template || meta.template || "N/A";
    const plan = meta.plan || "N/A"; // plan comes from Stripe metadata, not business_profiles
    const industry = bp?.industry || meta.industry || "N/A";
    const city = bp?.city || meta.city || "";
    const state = bp?.state || meta.state || "";
    const services = bp?.services || meta.services || [];
    const phone = bp?.phone || meta.phone || "";
    const description = bp?.description || meta.about_text || "";
    console.log(`✅ User: ${email} | Business: ${biz} | Template: ${template} | Source: ${bp ? "business_profiles" : "user_metadata"}`);

    // ── Step 2: Send welcome email ────────────────────────────────
    console.log("\n⏳ Step 2: Sending welcome email...");
    await sendEmail(
      email,
      "Welcome to Skooped! Your AI team is on it 🚀",
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#361C24">Welcome to Skooped!</h1>
        <p>Hey ${name},</p>
        <p>Your AI marketing team is already getting to work. Your website is being built right now and will be live in under 60 seconds.</p>
        <p><b>What's happening:</b></p>
        <ul>
          <li>✅ Your website is being built</li>
          <li>✅ SEO optimization starting</li>
          <li>✅ Your dashboard is ready</li>
        </ul>
        <p>Check your dashboard: <a href="https://app.skooped.io">app.skooped.io</a></p>
        <p>— Cooper & the Skooped team</p>
      </div>`
    );

    // ── Step 3: Notify Slack ──────────────────────────────────────
    console.log("\n⏳ Step 3: Notifying Slack...");
    await notifySlack(
      `🎉 *New client signup!*\n\nBusiness: *${biz}*\nIndustry: ${industry}\nPlan: ${plan}\nEmail: ${email}\nTemplate: ${template}\n\nDeploy pipeline firing now...`
    );

    // ── Step 4: Run deploy pipeline ───────────────────────────────
    if (template === "custom" || template === "custom-cooper" || template === "concierge") {
      console.log(`\nℹ️ Template is '${template}' — skipping auto-deploy. Manual build required.`);
      await notifySlack(`🎨 *Custom build requested!*\n\nBusiness: *${biz}*\nIndustry: ${industry}\nLocation: ${city}, ${state}\nServices: ${Array.isArray(services) ? services.join(", ") : services}\nPhone: ${phone}\nEmail: ${email}\nPlan: ${plan}\n\nNeeds manual Lovable build.`);

      // Log to Supabase
      const orgId = await getOrgId(userId);
      if (orgId) {
        await supabaseInsert("site_deployments", {
          org_id: orgId,
          user_id: userId,
          status: "pending",
          template,
        });
        await supabaseInsert("agent_activity", {
          org_id: orgId,
          agent: "cooper",
          action_type: "custom_build_request",
          description: `Custom build requested for ${biz} (${template}). Awaiting manual Lovable build.`,
          metadata: { template, plan, industry, city, state, services },
        });
      }
      return;
    }

    console.log("\n⏳ Step 4: Running deploy pipeline...");
    const scriptPath = new URL("./deploy-client-site.ts", import.meta.url).pathname;
    const envVars = [
      `VERCEL_TOKEN="${VERCEL_TOKEN}"`,
      `SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"`,
      `SUPABASE_URL="${SUPABASE_URL}"`,
      `GITHUB_TOKEN="${GITHUB_TOKEN}"`,
    ].join(" ");

    const output = execSync(
      `${envVars} npx tsx "${scriptPath}" --userId ${userId}`,
      { encoding: "utf-8", timeout: 300_000, cwd: new URL("..", import.meta.url).pathname }
    );
    console.log(output);

    // Extract deployed URL
    const urlMatch = output.match(/URL:\s*(https:\/\/[^\s]+)/);
    const deployedUrl = urlMatch?.[1] ?? "unknown";

    // ── Step 5: Send "site is live" email ─────────────────────────
    if (deployedUrl !== "unknown") {
      console.log("\n⏳ Step 5: Sending 'site is live' email...");
      await sendEmail(
        email,
        "Your website is LIVE! 🎉",
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#361C24">Your website is live! 🎉</h1>
          <p>Hey ${name},</p>
          <p>Your new website has been deployed and is ready for the world to see.</p>
          <p><a href="${deployedUrl}" style="display:inline-block;padding:12px 24px;background:#361C24;color:white;text-decoration:none;border-radius:8px;font-weight:bold">View Your Website →</a></p>
          <p>URL: <a href="${deployedUrl}">${deployedUrl}</a></p>
          <p>Your AI team is now working on SEO optimization and marketing. You'll start seeing results within 30-60 days.</p>
          <p>Check your dashboard anytime: <a href="https://app.skooped.io">app.skooped.io</a></p>
          <p>— Cooper & the Skooped team</p>
        </div>`
      );

      // ── Step 6: Slack — site is live ──────────────────────────────
      await notifySlack(`✅ *${biz}* website deployed!\n🌐 ${deployedUrl}\n📦 Template: ${template}\n💰 Plan: ${plan}`);
    }

    // ── Step 7: Write to Supabase (site_deployments + agent_activity) ──
    const orgId = await getOrgId(userId);
    if (orgId) {
      await supabaseInsert("site_deployments", {
        org_id: orgId,
        user_id: userId,
        site_url: deployedUrl !== "unknown" ? deployedUrl : null,
        repo_name: `site-${biz.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`,
        status: deployedUrl !== "unknown" ? "live" : "failed",
        template,
        deployed_at: new Date().toISOString(),
      });
      console.log("  ✅ Written to site_deployments");

      await supabaseInsert("agent_activity", {
        org_id: orgId,
        agent: "bob",
        action_type: "site_deploy",
        description: `Website deployed to ${deployedUrl !== "unknown" ? deployedUrl : "unknown"} (${template} template)`,
        metadata: { template, plan, deployedUrl, userId },
      });
      console.log("  ✅ Written to agent_activity");
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎉 PIPELINE COMPLETE — ${deployedUrl}`);
    console.log(`${"=".repeat(60)}\n`);

  } catch (err: any) {
    console.error(`\n❌ Pipeline failed:`, err.message);
    if (err.stdout) console.error("stdout:", err.stdout);
    if (err.stderr) console.error("stderr:", err.stderr);
    
    // Notify slack about failure
    await notifySlack(`🔴 *Deploy pipeline failed*\nError: ${err.message}\nCheck Render logs.`).catch(() => {});

    // Log failure to Supabase
    try {
      const rawBody2 = JSON.stringify({ userId: "unknown" });
      // Try to extract userId from the error context
      const failUserId = (err as any)._userId;
      if (failUserId) {
        const failOrgId = await getOrgId(failUserId);
        if (failOrgId) {
          await supabaseInsert("site_deployments", {
            org_id: failOrgId,
            user_id: failUserId,
            status: "failed",
            error_message: err.message?.slice(0, 500),
          });
          await supabaseInsert("agent_activity", {
            org_id: failOrgId,
            agent: "bob",
            action_type: "deploy_failed",
            description: `Deploy pipeline failed: ${err.message?.slice(0, 200)}`,
          });
        }
      }
    } catch { /* don't let logging failure mask the real error */ }
  }
});

server.listen(PORT, () => {
  console.log(`\n🔧 Skooped Deploy Server running on port ${PORT}`);
  console.log(`   POST /deploy { "userId": "..." }`);
  console.log(`   GET  /health\n`);
});
