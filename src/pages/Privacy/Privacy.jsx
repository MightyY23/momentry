import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";

import styles from "./Privacy.module.css";

/**
 * Privacy Policy — the Play Store data-safety
 * disclosures, written in plain language.
 * Keep in sync with what the app actually
 * collects (see the Data We Collect section).
 */
function Privacy() {
  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.page}>
          <span className={styles.badge}>
            🔒 Privacy
          </span>

          <h1>Privacy Policy</h1>

          <p className={styles.updated}>
            Last updated: September 17, 2026
          </p>

          <p className={styles.intro}>
            Momentry is a private space for two
            people to keep their memories
            together. This policy explains, in
            plain language, what we collect, why,
            and how it stays safe.
          </p>

          <section>
            <h2>The short version</h2>

            <ul>
              <li>
                Your memories, photos, videos,
                chats and personal dates belong to
                you and your partner — only you
                two can see them.
              </li>

              <li>
                We never sell your data or show
                ads.
              </li>

              <li>
                Everything is stored securely on
                Supabase (Google Cloud) with
                row-level database security.
              </li>

              <li>
                You can export or permanently
                delete everything from inside the
                app.
              </li>
            </ul>
          </section>

          <section>
            <h2>Data we collect</h2>

            <div className={styles.table}>
              <div className={styles.thead}>
                <span>Data</span>

                <span>Why</span>

                <span>Required?</span>
              </div>

              <div className={styles.trow}>
                <span>Email address</span>

                <span>
                  Sign-in, partner invitations,
                  security
                </span>

                <span>Required</span>
              </div>

              <div className={styles.trow}>
                <span>Name &amp; profile photo</span>

                <span>
                  So your partner recognises you
                  across the app
                </span>

                <span>Name required; photo
                optional</span>
              </div>

              <div className={styles.trow}>
                <span>Birthday &amp; anniversary</span>

                <span>
                  Reminder features (occasions,
                  gifting)
                </span>

                <span>
                  Optional — you choose whether to
                  add them
                </span>
              </div>

              <div className={styles.trow}>
                <span>Memories (text, photos,
                videos, dates, locations)</span>

                <span>
                  The core feature — building your
                  timeline, gallery, map and
                  StoryBook
                </span>

                <span>
                  Core content; location is
                  optional per memory
                </span>
              </div>

              <div className={styles.trow}>
                <span>Chat messages &amp; voice
                notes</span>

                <span>
                  Private conversation with your
                  partner
                </span>

                <span>Optional feature</span>
              </div>

              <div className={styles.trow}>
                <span>Push notification token</span>

                <span>
                  Delivering message &amp; reminder
                  notifications to your device
                </span>

                <span>
                  Only if you enable notifications
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2>What we never do</h2>

            <ul>
              <li>
                We don't sell or share your data
                with advertisers or data brokers.
              </li>

              <li>
                We don't track you across other
                apps or websites.
              </li>

              <li>
                We don't read your memories or
                chats — database access is
                enforced per-account by Row Level
                Security, so even database
                operators can't casually browse
                your content.
              </li>

              <li>
                We don't use your photos or
                stories for AI training. The AI
                StoryBook feature only processes
                your own memory text through a
                secure server at your request.
              </li>
            </ul>
          </section>

          <section>
            <h2>How your data is protected</h2>

            <ul>
              <li>
                All traffic is encrypted (HTTPS).
              </li>

              <li>
                Passwords are handled exclusively
                by Supabase Auth (bcrypt, never
                visible to us).
              </li>

              <li>
                Photos and videos live in private
                storage buckets; access requires
                your signed-in session.
              </li>

              <li>
                Location data is only attached to
                a memory when you explicitly pick
                it, and can be removed by editing
                the memory.
              </li>
            </ul>
          </section>

          <section>
            <h2>Data retention &amp; deletion</h2>

            <p>
              Your data is kept until you delete
              it. From Settings you can:
            </p>

            <ul>
              <li>
                Export your memories and stories
                at any time.
              </li>

              <li>
                Delete individual memories,
                photos, videos, or chat messages.
              </li>

              <li>
                Delete your account — this
                permanently removes your profile,
                memberships and personal data,
                with storage files cleaned up by
                a server-side process.
              </li>
            </ul>
          </section>

          <section>
            <h2>Children's privacy</h2>

            <p>
              Momentry is not directed at children
              under 13, and sign-up enforces a
              minimum age of 13. If you believe a
              child under 13 has created an
              account, contact us and we will
              remove it.
            </p>
          </section>

          <section>
            <h2>Contact</h2>

            <p>
              Questions, data requests or
              complaints:{" "}
              <a href="mailto:support@momentry.app">
                support@momentry.app
              </a>
            </p>
          </section>
        </div>
      </Container>
    </PageLayout>
  );
}

export default Privacy;
