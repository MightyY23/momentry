import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Heart,
  Lock,
  MapPin,
  Sparkles,
} from "lucide-react";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";

import { getPublicSharedStory } from "../../services/share/getPublicSharedStory";

import styles from "./SharedStory.module.css";

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SharedStory() {
  const { shareCode } = useParams();

  const [story, setStory] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] =
    useState(false);

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  //---------------------------------------
  // Load public story via RPC
  //---------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load(passedPassword = null) {
      try {
        setLoading(true);

        setNeedsPassword(false);

        const { story: storyData, moments: momentData } =
          await getPublicSharedStory(
            shareCode,
            passedPassword
          );

        if (cancelled) return;

        if (!storyData) {
          // Invalid code / revoked / expired — OR a
          // protected share without the right password.
          // Distinguish by asking for a password once.
          const { getShare } = await import(
            "../../services/share/getShare"
          );

          try {
            await getShare(shareCode);
          } catch {
            if (cancelled) return;

            setStory(null);

            return;
          }

          if (cancelled) return;

          // Share exists but story fetch failed —
          // it must be password protected.
          setNeedsPassword(true);

          setStory(null);

          setMoments([]);
        } else {
          setStory(storyData);

          setMoments(momentData);

          setNeedsPassword(false);

          setPasswordError(false);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setStory(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [shareCode]);

  //---------------------------------------
  // Password submit
  //---------------------------------------

  async function handlePasswordSubmit(e) {
    e.preventDefault();

    if (!password.trim()) {
      setPasswordError(true);

      return;
    }

    try {
      setSubmitting(true);

      const { story: storyData, moments: momentData } =
        await getPublicSharedStory(
          shareCode,
          password.trim()
        );

      if (!storyData) {
        setPasswordError(true);

        return;
      }

      setStory(storyData);

      setMoments(momentData);

      setNeedsPassword(false);

      setPasswordError(false);
    } catch (err) {
      console.error(err);

      setPasswordError(true);
    } finally {
      setSubmitting(false);
    }
  }

  //---------------------------------------
  // Sorted memories (oldest first) + stats
  //---------------------------------------

  const sortedMoments = useMemo(() => {
    return [...moments].sort(
      (a, b) =>
        new Date(a.memory_date) -
        new Date(b.memory_date)
    );
  }, [moments]);

  const places = useMemo(() => {
    return new Set(
      moments
        .map((m) => m.location)
        .filter(Boolean)
    ).size;
  }, [moments]);

  const firstDate = sortedMoments[0]
    ? formatDate(sortedMoments[0].memory_date)
    : null;

  //---------------------------------------
  // Loading
  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className={styles.state}>
            <div
              className={styles.stateSpinner}
            />

            <h2>Opening this story…</h2>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // Password gate
  //---------------------------------------

  if (needsPassword) {
    return (
      <PageLayout>
        <Container>
          <div className={styles.state}>
            <div className={styles.stateIcon}>
              🔒
            </div>

            <h2>Protected story</h2>

            <p>
              This story is shared with a
              password. Enter it to continue
              reading.
            </p>

            <form
              className={styles.passwordForm}
              onSubmit={
                handlePasswordSubmit
              }
            >
              <label className={styles.passwordField}>
                <Lock size={16} />

                <input
                  type="password"
                  placeholder="Share password"
                  value={password}
                  onChange={(e) => {
                    setPassword(
                      e.target.value
                    );

                    setPasswordError(
                      false
                    );
                  }}
                  aria-label="Share password"
                />
              </label>

              {passwordError && (
                <p
                  className={
                    styles.passwordError
                  }
                >
                  That password didn't
                  match. Try again.
                </p>
              )}

              <Button
                type="submit"
                loading={submitting}
              >
                Unlock Story
              </Button>
            </form>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // Not found / revoked / expired
  //---------------------------------------

  if (!story) {
    return (
      <PageLayout>
        <Container>
          <div className={styles.state}>
            <div className={styles.stateIcon}>
              🔗
            </div>

            <h2>
              This link isn't available
            </h2>

            <p>
              The story may have been
              unshared, expired, or the link
              might be incorrect.
            </p>

            <Link
              to="/"
              className={styles.stateLink}
            >
              Visit Momentry →
            </Link>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // Story
  //---------------------------------------

  return (
    <PageLayout>
      <Container>
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          {/* ------- Hero ------- */}

          <header className={styles.hero}>
            {story.cover_photo && (
              <div
                className={styles.coverWrap}
              >
                <img
                  src={story.cover_photo}
                  alt={`${story.title} cover`}
                  className={
                    styles.coverPhoto
                  }
                />
              </div>
            )}

            <h1 className={styles.title}>
              {story.title}
            </h1>

            <p className={styles.tagline}>
              A story shared with love, on
              Momentry.
            </p>

            <div className={styles.statRow}>
              <div
                className={styles.stat}
              >
                <Heart size={16} />

                <strong>
                  {moments.length}
                </strong>

                <span>
                  {moments.length === 1
                    ? "Memory"
                    : "Memories"}
                </span>
              </div>

              {places > 0 && (
                <div
                  className={styles.stat}
                >
                  <MapPin
                    size={16}
                  />

                  <strong>
                    {places}
                  </strong>

                  <span>
                    Places
                  </span>
                </div>
              )}

              {firstDate && (
                <div
                  className={styles.stat}
                >
                  <CalendarDays
                    size={16}
                  />

                  <span>
                    Since{" "}
                    {firstDate}
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* ------- Timeline ------- */}

          {sortedMoments.length === 0 ? (
            <div className={styles.empty}>
              <h2>
                No memories yet
              </h2>

              <p>
                This story is just getting
                started.
              </p>
            </div>
          ) : (
            <div
              className={styles.timeline}
            >
              {sortedMoments.map(
                (
                  moment,
                  index
                ) => (
                  <motion.article
                    key={moment.id}
                    className={
                      styles.card
                    }
                    initial={{
                      opacity: 0,
                      y: 30,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.5,
                      delay:
                        Math.min(
                          index *
                            0.08,
                          0.4
                        ),
                    }}
                  >
                    {moment.image_url && (
                      <img
                        src={
                          moment.image_url
                        }
                        alt={
                          moment.title
                        }
                        loading="lazy"
                      />
                    )}

                    <div
                      className={
                        styles.content
                      }
                    >
                      <div
                        className={
                          styles.cardHeader
                        }
                      >
                        <h2>
                          {
                            moment.title
                          }
                        </h2>

                        {moment.is_favorite && (
                          <span
                            className={
                              styles.favorite
                            }
                            aria-label="Favorite memory"
                          >
                            <Heart
                              size={15}
                              fill="currentColor"
                            />
                          </span>
                        )}
                      </div>

                      <div
                        className={
                          styles.meta
                        }
                      >
                        {moment.memory_date && (
                          <span>
                            <CalendarDays
                              size={
                                14
                              }
                            />

                            {formatDate(
                              moment.memory_date
                            )}
                          </span>
                        )}

                        {moment.location && (
                          <span>
                            <MapPin
                              size={
                                14
                              }
                            />

                            {
                              moment.location
                            }
                          </span>
                        )}
                      </div>

                      {moment.description && (
                        <p>
                          {
                            moment.description
                          }
                        </p>
                      )}
                    </div>
                  </motion.article>
                )
              )}
            </div>
          )}

          {/* ------- Footer CTA ------- */}

          <footer
            className={styles.footer}
          >
            <div
              className={
                styles.footerBadge
              }
            >
              <Sparkles
                size={15}
              />

              Made with Momentry
            </div>

            <p>
              Every memory deserves its
              own chapter.
            </p>

            <Link
              to="/"
              className={styles.cta}
            >
              <Button>
                Preserve your
                memories too
              </Button>
            </Link>
          </footer>
        </motion.div>
      </Container>
    </PageLayout>
  );
}

export default SharedStory;
