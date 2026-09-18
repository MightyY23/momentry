#!/usr/bin/env node
/**
 * signing-env.cjs — Bubblewrap signing helper.
 *
 * Loads the keystore passwords from `%USERPROFILE%\.bubblewrap\signingKey.txt`
 * into the environment variables Bubblewrap reads
 * (BUBBLEWRAP_KEYSTORE_PASSWORD / BUBBLEWRAP_KEY_PASSWORD) and then runs the
 * requested command, so the password never appears in chat, logs, or history.
 *
 * signingKey.txt format (created by you, never committed):
 *   line 1: keystore password
 *   line 2: key password      (same as line 1 if you used one password)
 *
 * Usage:
 *   node scripts/signing-env.cjs check    # verify file + keystore match
 *   node scripts/signing-env.cjs build    # run `npx @bubblewrap/cli build`
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PASSWORD_FILE = path.join(os.homedir(), ".bubblewrap", "signingKey.txt");

function loadPasswords() {
  if (!fs.existsSync(PASSWORD_FILE)) {
    console.error(`
=============================================================
 MISSING SIGNING PASSWORD FILE
=============================================================
Create this file (Notepad is fine):

  ${PASSWORD_FILE}

with EXACTLY two lines:
  line 1: your keystore password
  line 2: your key password (same value if identical)

Then re-run this command. The file is local-only and is
already covered by Bubblewrap's own folder (not committed).
=============================================================
`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(PASSWORD_FILE, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    console.error(
      "signingKey.txt must have 2 lines: keystore password, then key password."
    );
    process.exit(1);
  }

  return { keystore: lines[0].trim(), key: lines[1].trim() };
}

function shortPath(p) {
  // Windows: short 8.3 paths avoid quoting issues from spaces in usernames.
  try {
    const out = spawnSync(
      "cmd.exe",
      ["/c", `for %I in ("${p}") do @echo %~sI`],
      { encoding: "utf8" }
    );
    const s = (out.stdout || "").trim().split(/\r?\n/)[0]?.trim() || "";
    if (s && !s.includes(" ") && fs.existsSync(s)) return s;
  } catch {}
  return p;
}

const mode = process.argv[2] || "check";
const { keystore, key } = loadPasswords();

const ANDROID_SDK = shortPath(path.join(os.homedir(), ".bubblewrap", "android_sdk"));

const env = {
  ...process.env,
  BUBBLEWRAP_KEYSTORE_PASSWORD: keystore,
  BUBBLEWRAP_KEY_PASSWORD: key,
  JAVA_HOME: shortPath(path.join(os.homedir(), ".bubblewrap", "jdk", "jdk-17.0.11+9")),
  ANDROID_HOME: ANDROID_SDK,
  ANDROID_SDK_ROOT: ANDROID_SDK,
};

// Bubblewrap spawns `gradlew.bat` from the project cwd. The Node security
// default (NoDefaultCurrentDirectoryInExePath=1) blocks current-directory
// executables — unset it for the child so the wrapper script resolves.
for (const k of Object.keys(env)) {
  if (/NoDefaultCurrentDirectoryInExePath/i.test(k)) delete env[k];
}

const KEYSTORE = path.resolve(__dirname, "..", "momentry.keystore");

if (mode === "check") {
  console.log("Password file found and loaded (value hidden).");
  console.log("Keystore:", KEYSTORE, fs.existsSync(KEYSTORE) ? "(exists)" : "(MISSING!)");
  console.log("JAVA_HOME:", env.JAVA_HOME);

  const keytool = path.join(env.JAVA_HOME, "bin", "keytool.exe");
  const res = spawnSync(
    keytool,
    ["-list", "-v", "-keystore", KEYSTORE, "-alias", "momentry", "-storepass", keystore],
    { encoding: "utf8" }
  );
  const out = res.stdout || "";
  const sha = (out.match(/SHA256:\s*([A-F0-9:]+)/i) || [])[1];
  if (!sha) {
    console.error("Could not read keystore (wrong password?) — nothing was changed.");
    process.exit(1);
  }
  console.log("\nKeystore unlock: OK");
  console.log("SHA256:", sha);

  // Compare with the deployed assetlinks.json.
  const curl = spawnSync("curl", ["-s", "https://momentry-smoky.vercel.app/.well-known/assetlinks.json"], {
    encoding: "utf8",
  });
  const live = (curl.stdout || "").toUpperCase().replace(/\s/g, "");
  console.log(
    "\nassetlinks.json match:",
    live.includes(sha.toUpperCase().replace(/\s/g, "")) ? "MATCH ✓" : "NO MATCH ✗ (update public/.well-known/assetlinks.json and redeploy)"
  );
  process.exit(0);
}

if (mode === "build") {
  // Full native pipeline — Bubblewrap's own signing steps mishandle the
  // space in this Windows username (C:\Users\m s i), so we drive the same
  // tools directly with correct quoting. Output: app-release-bundle.aab
  // (Play upload) + app-release-signed.apk (sideload testing).
  const bt = shortPath(path.join(os.homedir(), ".bubblewrap", "android_sdk", "build-tools", "36.1.0"));
  const java = path.join(env.JAVA_HOME, "bin", "java.exe");
  const jarsigner = path.join(env.JAVA_HOME, "bin", "jarsigner.exe");
  const passArgs = ["-storepass:file", PASSWORD_FILE, "-keypass:file", PASSWORD_FILE];

  function run(cmd, args) {
    const r = spawnSync(cmd, args, { stdio: "inherit", env, shell: false });
    if (r.status !== 0) {
      console.error(`\nFAILED: ${path.basename(cmd)} ${args.join(" ")} (exit ${r.status})`);
      process.exit(r.status ?? 1);
    }
  }

  console.log("1/3  gradlew bundleRelease");
  // .bat files can't be spawned directly (Node EINVAL rule) — go through cmd.exe.
  run("cmd.exe", ["/c", "gradlew.bat", "bundleRelease", "--stacktrace"]);

  console.log("2/3  jarsigner (sign the .aab)");
  run(jarsigner, [
    "-keystore", KEYSTORE,
    "-signedjar", "app-release-bundle.aab",
    "app/build/outputs/bundle/release/app-release.aab",
    "momentry",
    ...passArgs,
  ]);

  console.log("3/3  zipalign + apksigner (build + sign the .apk)");
  const unsigned = path.resolve("app", "build", "outputs", "apk", "release", "app-release-unsigned.apk");
  const aligned = path.resolve("app-release-unsigned-aligned.apk");
  const signed = path.resolve("app-release-signed.apk");
  run(path.join(bt, "zipalign.exe"), ["-f", "4", unsigned, aligned]);
  run(java, ["-jar", path.join(bt, "lib", "apksigner.jar"), "sign",
    "--ks", KEYSTORE, "--ks-key-alias", "momentry",
    "--ks-pass", `pass:${keystore}`, "--key-pass", `pass:${key}`,
    "--out", signed, aligned]);

  console.log("\nDONE: app-release-bundle.aab (Play upload) + app-release-signed.apk (sideload)");
  process.exit(0);
}

console.error("Unknown mode:", mode, "(use: check | build)");
process.exit(1);
