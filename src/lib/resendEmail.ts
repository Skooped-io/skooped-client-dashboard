/**
 * Reusable Resend email utility for Skooped.io
 *
 * Usage:
 *   await sendEmail({
 *     to: ['client@example.com'],
 *     subject: 'Hello',
 *     html: '<p>Hi there</p>',
 *     replyTo: 'visitor@example.com',
 *   });
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM = "Skooped <noreply@skooped.io>";

export interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY env var is required");
  }

  const body: Record<string, unknown> = {
    from: FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };
  if (options.replyTo) {
    body.reply_to = options.replyTo;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error (${res.status}): ${text}`);
  }
}
