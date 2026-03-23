/**
 * Local webhook server for n8n to trigger the deploy pipeline.
 * Runs on the host machine (not inside Docker) so it has access to gh CLI.
 *
 * Usage:
 *   VERCEL_TOKEN=... SUPABASE_SERVICE_KEY=... npx tsx scripts/deploy-webhook-server.ts
 *
 * n8n calls: POST http://host.docker.internal:3456/deploy { "userId": "..." }
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { execSync } from "child_process";

const PORT = parseInt(process.env.PORT ?? "3456", 10);

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://ordxzakffddgytanahnc.supabase.co";

if (!VERCEL_TOKEN || !SUPABASE_SERVICE_KEY) {
  console.error("❌ VERCEL_TOKEN and SUPABASE_SERVICE_KEY env vars required");
  process.exit(1);
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "POST" || req.url !== "/deploy") {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  try {
    const rawBody = await parseBody(req);
    const { userId } = JSON.parse(rawBody);

    if (!userId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "userId required" }));
      return;
    }

    console.log(`\n🚀 Deploy triggered for userId: ${userId}`);

    // Run the deploy script
    const scriptPath = new URL("./deploy-client-site.ts", import.meta.url).pathname;
    const cmd = `VERCEL_TOKEN="${VERCEL_TOKEN}" SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}" SUPABASE_URL="${SUPABASE_URL}" npx tsx "${scriptPath}" --userId ${userId}`;

    const output = execSync(cmd, {
      encoding: "utf-8",
      timeout: 300_000, // 5 min
      cwd: new URL("..", import.meta.url).pathname,
    });

    console.log(output);

    // Extract deployed URL from output
    const urlMatch = output.match(/URL:\s*(https:\/\/[^\s]+)/);
    const deployedUrl = urlMatch?.[1] ?? "unknown";

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, url: deployedUrl, output }));
  } catch (err: any) {
    console.error(`❌ Deploy failed:`, err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message, stdout: err.stdout, stderr: err.stderr }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🔧 Deploy webhook server running on http://localhost:${PORT}/deploy`);
  console.log(`   n8n should call: POST http://host.docker.internal:${PORT}/deploy`);
  console.log(`   Body: { "userId": "..." }\n`);
});
