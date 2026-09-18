#!/usr/bin/env node
// ============================================================
// MOMENTRY PUSH — one guided command to turn on notifications
//
//   npm run setup:push
//
// Steps (each one asks before running):
//   1. Check prerequisites (Node, supabase CLI, logged in)
//   2. Generate VAPID keypair (web-push)
//   3. Set secrets on the Supabase project
//   4. Deploy the `push` Edge Function
//   5. Print the VITE_VAPID_PUBLIC_KEY to add in Vercel
//
// Safe to re-run: existing keys are kept unless you choose
// to regenerate.
// ============================================================

import { execSync, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { setTimeout as sleep } from "node:timers/promises";

const PROJECT_HINT = process.argv[2] || ""; // optional: supabase project ref

function run(cmd, { stdio = "pipe", label } = {}) {
  if (label) console.log(`\n▸ ${label}`);
  try {
    const out = execSync(cmd, { stdio, encoding: "utf8" });
    return { ok: true, out };
  } catch (err) {
    return { ok: false, out: (err.stdout || "") + (err.stderr || String(err)) };
  }
}

function has(cmd) {
  return spawnSync(cmd, ["--version"], { shell: true }).status === 0;
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q) => rl.question(q);
const confirm = async (q) => {
  const a = (await ask(`${q} [Y/n] `)).trim().toLowerCase();
  return a === "" || a === "y" || a === "yes";
};

function section(t) {
  console.log(`\n\x1b[35m── ${t} ${"─".repeat(Math.max(0, 50 - t.length))}\x1b[0m`);
}

async function main() {
  console.log("\n💕  Momentry — Push Notifications Setup\n");

  // ---------- 1. Prerequisites ----------
  section("1 · Prerequisites");
  if (!has("node")) {
    console.error("✗ Node.js not found.");process.exit(1);
  }
  console.log("✓ Node.js");

  if (!has("supabase")) {
    console.error("✗ Supabase CLI not found. Install it first:");
    console.error("    npm install -g supabase");
    process.exit(1);
  }
  console.log("✓ Supabase CLI");

  const who = run("npx supabase projects list --output json");
  if (!who.ok || /not logged in|Login required/i.test(who.out)) {
    console.log("… not logged in to Supabase. Opening login …");
    run("npx supabase login", { stdio: "inherit" });
  } else {
    console.log("✓ Logged in to Supabase");
  }

  // Pick project
  let projectRef = PROJECT_HINT;
  if (!projectRef) {
    const list = run("npx supabase projects list --output json");
    try {
      const projects = JSON.parse(list.out);
      if (projects.length === 1) projectRef = projects[0].id;
      else if (projects.length > 1) {
        console.log("\nYour Supabase projects:");
        projects.forEach((p, i) =>
          console.log(`  [${i + 1}] ${p.name} (${p.id})`)
        );
        const pick = await ask("Project number: ");
        projectRef = projects[Number(pick) - 1]?.id;
      }
    } catch {
      /* fall through to manual entry */
    }
  }
  if (!projectRef) projectRef = (await ask("Supabase project ref: ")).trim();
  console.log(`✓ Project: ${projectRef}`);

  // ---------- 2. VAPID keys ----------
  section("2 · VAPID keys");
  let pub = process.env.VAPID_PUBLIC_KEY || "";
  let priv = process.env.VAPID_PRIVATE_KEY || "";

  if (pub && priv) {
    console.log("✓ Using keys from environment");
  } else {
    console.log("… generating a new VAPID keypair …");
    const gen = run("npx --yes web-push generate-vapid-keys");
    if (!gen.ok) {
      console.error("✗ Could not generate keys:\n" + gen.out);
      process.exit(1);
    }
    for (const line of gen.out.split("\n")) {
      const m = line.match(/Public Key:\s*(\S+)/);
      if (m) pub = m[1];
      const m2 = line.match(/Private Key:\s*(\S+)/);
      if (m2) priv = m2[1];
    }
    console.log(`✓ Public key: ${pub.slice(0, 12)}…`);
  }

  const subject =
    (await ask(
      "\nContact for the push header (mailto:you@email.com) [mailto:you@example.com]: "
    )) || "mailto:you@example.com";

  // ---------- 3. Secrets ----------
  section("3 · Supabase secrets");
  if (await confirm("Set VAPID secrets on the project?")) {
    const res = run(
      `npx supabase secrets set --project-ref ${projectRef} ` +
        `VAPID_PUBLIC_KEY=${pub} VAPID_PRIVATE_KEY=${priv} VAPID_SUBJECT="${subject}"`
    );
    console.log(res.ok ? "✓ Secrets set" : "✗ Failed:\n" + res.out);
  } else {
    console.log("… skipped");
  }

  // ---------- 4. Deploy ----------
  section("4 · Deploy push Edge Function");
  if (await confirm("Deploy supabase/functions/push now?")) {
    const res = run(
      `npx supabase functions deploy push --project-ref ${projectRef}`,
      { stdio: "inherit" }
    );
    console.log(res.ok ? "✓ Deployed" : "✗ Deploy failed (see above)");
  } else {
    console.log("… skipped — deploy later with:");
    console.log(`    npx supabase functions deploy push --project-ref ${projectRef}`);
  }

  // ---------- 5. Vercel ----------
  section("5 · Final step — Vercel");
  console.log("\nAdd this environment variable in Vercel");
  console.log("(Project → Settings → Environment Variables), then redeploy:\n");
  console.log(`\x1b[36mVITE_VAPID_PUBLIC_KEY=${pub}\x1b[0m\n`);
  console.log("Or with the CLI:");
  console.log(`    npx vercel env add VITE_VAPID_PUBLIC_KEY production`);
  console.log("\nDone 💟  After redeploying, toggle 🔔 Notifications in");
  console.log("Settings → Appearance and send a test from the other phone.");

  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
