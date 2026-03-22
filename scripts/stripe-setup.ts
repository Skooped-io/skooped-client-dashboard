/**
 * Stripe Product & Price Setup Script
 *
 * Creates the 3 Skooped subscription plans in Stripe (test mode) and outputs
 * the price IDs to paste into src/lib/stripe.ts.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 *
 * Prerequisites:
 *   npm install -D tsx   (or use: npx tsx directly)
 *
 * After running, copy the printed PRICE_IDS block into src/lib/stripe.ts.
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("❌ Error: STRIPE_SECRET_KEY env var is required.");
  console.error("   Usage: STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts");
  process.exit(1);
}

if (!STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  console.error("❌ Error: Only test keys (sk_test_...) are allowed in this script.");
  process.exit(1);
}

const BASE_URL = "https://api.stripe.com/v1";
const AUTH_HEADERS = {
  Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
  "Content-Type": "application/x-www-form-urlencoded",
};

async function stripePost(path: string, params: Record<string, string>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: new URLSearchParams(params).toString(),
  });
  const data = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !data.id) {
    throw new Error(`Stripe API error on ${path}: ${data.error?.message ?? "unknown error"}`);
  }
  return data as { id: string };
}

const PLANS = [
  {
    key: "Starter",
    name: "Skooped Starter",
    description: "Custom website, Basic SEO, Google Business Profile, Monthly report",
    amount: 4900, // $49.00
  },
  {
    key: "Growth",
    name: "Skooped Growth",
    description:
      "Everything in Starter + Social media management, Google Ads, Weekly reports, Priority support",
    amount: 9900, // $99.00
  },
  {
    key: "Scale",
    name: "Skooped Scale",
    description:
      "Everything in Growth + Advanced SEO, Content creation, Call tracking, Dedicated account manager",
    amount: 14900, // $149.00
  },
];

async function main() {
  console.log("🚀 Creating Stripe products and prices (TEST MODE)...\n");

  const priceIds: Record<string, string> = {};

  for (const plan of PLANS) {
    // Create product
    const product = await stripePost("/products", {
      name: plan.name,
      description: plan.description,
    });
    console.log(`✅ Product: ${plan.name} → ${product.id}`);

    // Create recurring price
    const price = await stripePost("/prices", {
      product: product.id,
      unit_amount: String(plan.amount),
      currency: "usd",
      "recurring[interval]": "month",
      nickname: `${plan.name} Monthly`,
    });
    priceIds[plan.key] = price.id;
    console.log(`   Price:   $${plan.amount / 100}/mo → ${price.id}\n`);
  }

  console.log("─".repeat(60));
  console.log("✅ Done! Paste this into src/lib/stripe.ts:\n");
  console.log("export const PRICE_IDS: Record<string, string> = {");
  for (const [key, id] of Object.entries(priceIds)) {
    console.log(`  ${key}: '${id}',`);
  }
  console.log("};");
  console.log("\n⚠️  These are TEST price IDs. Run again with a live key for production.");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});
