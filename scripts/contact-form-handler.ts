/**
 * Skooped Contact Form Email Handler
 *
 * Simple Express server that receives contact form submissions from client
 * websites and emails them to the business owner via Resend.
 *
 * Usage:
 *   RESEND_API_KEY=... SUPABASE_SERVICE_KEY=... npx tsx scripts/contact-form-handler.ts
 *
 * Required env vars:
 *   RESEND_API_KEY       — Resend API key (1Password: "Skooped.io resend api key")
 *   SUPABASE_URL         — https://ordxzakffddgytanahnc.supabase.co
 *   SUPABASE_SERVICE_KEY — Supabase service role key
 *
 * POST /api/contact
 *   Body: { clientId, from_name, from_email, from_phone?, message }
 */

import express from "express";
import { sendEmail } from "../src/lib/resendEmail.js";

const app = express();
app.use(express.json());

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://ordxzakffddgytanahnc.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PORT = process.env.PORT ?? 3001;

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌  SUPABASE_SERVICE_KEY env var is required.");
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error("❌  RESEND_API_KEY env var is required.");
  process.exit(1);
}

interface ContactPayload {
  clientId: string;
  from_name: string;
  from_email: string;
  from_phone?: string;
  message: string;
}

async function fetchClientEmail(clientId: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${clientId}`,
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

  const user = (await res.json()) as { email: string };
  if (!user.email) {
    throw new Error(`No email found for client ${clientId}`);
  }
  return user.email;
}

function buildEmailHtml(payload: ContactPayload): string {
  const phone = payload.from_phone
    ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Phone</td><td style="padding:4px 0 4px 16px;font-size:14px;">${escapeHtml(payload.from_phone)}</td></tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#111827;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="margin-top:0;font-size:20px;">New message from your website</h2>
  <table style="border-collapse:collapse;margin-bottom:24px;">
    <tr>
      <td style="padding:4px 0;color:#6b7280;font-size:14px;">Name</td>
      <td style="padding:4px 0 4px 16px;font-size:14px;">${escapeHtml(payload.from_name)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#6b7280;font-size:14px;">Email</td>
      <td style="padding:4px 0 4px 16px;font-size:14px;"><a href="mailto:${escapeHtml(payload.from_email)}">${escapeHtml(payload.from_email)}</a></td>
    </tr>
    ${phone}
  </table>
  <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(payload.message)}</div>
  <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
    You can reply directly to this email — your reply will go to ${escapeHtml(payload.from_email)}.
    <br>Powered by <a href="https://skooped.io" style="color:#6366f1;">Skooped.io</a>
  </p>
</body>
</html>`.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.post("/api/contact", async (req, res) => {
  const { clientId, from_name, from_email, from_phone, message } =
    req.body as ContactPayload;

  if (!clientId || !from_name || !from_email || !message) {
    res.status(400).json({ error: "Missing required fields: clientId, from_name, from_email, message" });
    return;
  }

  try {
    const clientEmail = await fetchClientEmail(clientId);

    await sendEmail({
      to: [clientEmail],
      subject: `New message from your website — ${from_name}`,
      html: buildEmailHtml({ clientId, from_name, from_email, from_phone, message }),
      replyTo: from_email,
    });

    console.log(`✅ Contact email delivered — client: ${clientEmail}, from: ${from_email}`);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ Contact form error: ${message}`);
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`\n📬 Contact form handler running on port ${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/contact\n`);
});
