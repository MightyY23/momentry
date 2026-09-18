# 📲 Momentry → Google Play Store (TWA guide)

The app is a complete PWA, so Play Store publishing uses a **Trusted Web
Activity (TWA)** — a thin Android shell around the live site. No code
duplication; your Vercel deployment *is* the app.

## One-time prerequisites

1. **Google Play Console account** — one-time $25 fee
   <https://play.google.com/console>
2. **JDK 17** and **Android Studio** (for the SDK) — Bubblewrap needs both
3. Your site served over HTTPS (✅ Vercel) with a **custom domain strongly
   recommended** before review (e.g. `momentry.app`)

## Step 1 — Install Bubblewrap (once)

```bash
npm install -g @bubblewrap/cli
bubblewrap init --install   # downloads JDK + Android SDK on first run
```

## Step 2 — Generate the upload key (once)

```bash
bubblewrap fingerprint list            # shows sha256 of your keys (if any)
```

When Bubblewrap asks about signing during `init`, choose **"Create a new
signing key"** (it creates `android.keystore` + `android.txt` — keep both
SAFE; losing the key means you can never update the app).

## Step 3 — Create the project

```bash
cd /path/to/momentry
bubblewrap init --manifest https://momentry-smoky.vercel.app/manifest.webmanifest
# or, to use the checked-in config instead:
bubblewrap init --manifest=./twa-manifest.json
```

Answer defaults; set `packageId` = `com.momentry.app`.

## Step 4 — Point assetlinks at your real key

```bash
bubblewrap fingerprint list --output text
```

Copy the **SHA-256** fingerprint into
`public/.well-known/assetlinks.json` (replace
`REPLACE_WITH_YOUR_UPLOAD_KEY_SHA256`), commit, and push so Vercel serves
the updated file at
`https://<your-domain>/.well-known/assetlinks.json`.

> Play review checks this file. If it doesn't match, install-over-browser
> breaks and the app shows a browser bar.

## Step 5 — Build the bundle

```bash
npm run build:aab
```

Outputs:

- `app-release-bundle.aab` ← **upload this to Play**
- `app-release-signed.apk` ← for direct sideload testing

> **Why not plain `bubblewrap build`?** Two Windows quirks on this machine:
> the username contains spaces (`C:\Users\m s i`), which breaks Bubblewrap's
> quoting of the signing tools, and Node's
> `NoDefaultCurrentDirectoryInExePath` blocks its `gradlew.bat` spawn.
> `npm run build:aab` (`scripts/signing-env.cjs`) drives the **same tools**
> (Gradle → jarsigner → zipalign → apksigner) with correct quoting, loading
> passwords from `%USERPROFILE%\.bubblewrap\signingKey.txt` (2 lines:
> keystore password, key password — never committed, never printed).

### SDK repair (fresh machine — one-time)

If `~/.bubblewrap/android_sdk` is missing `cmdline-tools` / `platform-tools`
/ `build-tools` / `platforms`:

```bash
# 1. Download commandlinetools-win from dl.google.com and unzip to:
#    %USERPROFILE%\.bubblewrap\android_sdk\cmdline-tools\latest
# 2. Accept licenses + install what AGP 8.9.1 / Bubblewrap 1.25 need:
export JAVA_HOME="$USERPROFILE/.bubblewrap/jdk/jdk-17.0.11+9"
SDK="$USERPROFILE/.bubblewrap/android_sdk"
yes | "$SDK/cmdline-tools/latest/bin/sdkmanager.bat" --sdk_root="$SDK" --licenses
yes | "$SDK/cmdline-tools/latest/bin/sdkmanager.bat" --sdk_root="$SDK" \
  "platform-tools" "platforms;android-36" "build-tools;35.0.0" "build-tools;36.1.0"
```

(build-tools 36.1.0 is Bubblewrap 1.25's pinned zipalign/apksigner version;
35.0.0 is what AGP 8.9.1 uses. If Gradle can't reserve its heap, lower
`org.gradle.jvmargs` in `gradle.properties` — already set to 1024m here.)

## Step 6 — Play Console listing

1. **All apps → Create app**
   - Name: *Momentry — Love Memory StoryBook* (or similar)
   - Default language, App (not game), Free
2. **Store listing**: descriptions (short ≤80 chars, full ≤4000),
   screenshots — **phone + 7" tablet + landscape** (grab StoryBook and Chat
   in landscape), 512×512 icon, feature graphic 1024×500
3. **App content**:
   - Privacy policy URL: `https://<your-domain>/privacy` ✅ (already live)
   - Data safety: declare **email, photos/videos, birthdates, location,
     messages** — collected, stored server-side (Supabase), not shared
   - Content rating questionnaire → Everyone/Teen
   - Target audience: 18+ recommended (dating/couple app)
4. **Production → Create release** → upload `.aab` → roll out

## Step 7 — Before submitting, do these two things

1. **Custom SMTP in Supabase** (Auth → SMTP) — default quota blocks real
   signups during review
2. **Install the APK on a real phone** and run through:
   signup → partner-code pairing → add memory → StoryBook → chat → call

## Updating the app later

```bash
# bump appVersion / appVersionCode in twa-manifest.json first
npm run build:aab
```

The web code updates instantly for everyone — you only rebuild the TWA for
native-shell changes (icons, splash, shortcuts).
