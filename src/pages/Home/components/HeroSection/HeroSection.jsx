import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./HeroSection.module.css";

function HeroSection({
  story,
  anniversaryDate,
  memoriesCount,
  onJumpToTimeline,
}) {
  const navigate = useNavigate();

  const daysTogether = useMemo(() => {
    if (!anniversaryDate) return 0;

    const start = new Date(anniversaryDate);
    const today = new Date();

    return Math.max(
      0,
      Math.floor(
        (today - start) /
          (1000 * 60 * 60 * 24)
      )
    );
  }, [anniversaryDate]);

  const formattedDate = useMemo(() => {
    if (!anniversaryDate) return null;

    return new Date(
      anniversaryDate
    ).toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [anniversaryDate]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12)
      return "Good Morning ☀️";

    if (hour < 17)
      return "Good Afternoon 🌤️";

    if (hour < 21)
      return "Good Evening 🌙";

    return "Good Night 🌌";
  }, []);

  return (
    <motion.section
      className={
        story?.cover_photo
          ? `${styles.hero} heroHasCover`
          : styles.hero
      }
      initial={{
        opacity: 0,
        y: 35,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.55,
      }}
    >
      {/* Cover photo as the hero backdrop —
          the app "loads into" your story. */}
      {story?.cover_photo && (
        <div
          className={styles.coverBackdrop}
          aria-hidden="true"
        >
          <img
            src={story.cover_photo}
            alt=""
          />
        </div>
      )}

      <div className={styles.blurOne} />
      <div className={styles.blurTwo} />

      <div className={styles.content}>
        <div className={styles.left}>
          <span className={styles.badge}>
            ❤️ Momentry Dashboard
          </span>

          <h4 className={styles.greeting}>
            {greeting}
          </h4>

          <h1 className={styles.title}>
            {story?.title ||
              "Our Story"}
          </h1>

          <p className={styles.subtitle}>
            Every memory tells a story.
            Every story deserves to be
            remembered forever.
          </p>

          <div className={styles.highlights}>
            <div
              className={
                styles.highlight
              }
            >
              <span>📅</span>

              <div>
                <strong>
                  {daysTogether}
                </strong>

                <p>
                  {story?.anniversary_date
                    ? "Days Together"
                    : "Days In"}
                </p>
              </div>
            </div>

            <div
              className={
                styles.highlight
              }
            >
              <span>📸</span>

              <div>
                <strong>
                  {memoriesCount}
                </strong>

                <p>Memories Saved</p>
              </div>
            </div>

            <div
              className={
                styles.highlight
              }
            >
              <span>✨</span>

              <div>
                <strong>
                  {formattedDate ||
                    "--"}
                </strong>

                <p>
                  {story?.anniversary_date
                    ? "Together Since"
                    : "First Memory"}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/add-moment")}
            >
              <span>➕</span>
              Add Memory
            </button>

            <button
              className={styles.secondaryButton}
              onClick={onJumpToTimeline}
            >
              <span>🕰️</span>
              Our Timeline
            </button>
          </div>
        </div>

        <motion.div
          className={styles.right}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
          }}
        >
          <div
            className={
              styles.memoryCard
            }
          >
            <div
              className={
                styles.heart
              }
            >
              ❤️
            </div>

            <h3>
              {memoriesCount}
            </h3>

            <p>Total Memories</p>
          </div>

          <div
            className={
              styles.memoryCard
            }
          >
            <div
              className={
                styles.heart
              }
            >
              ⏳
            </div>

            <h3>
              {daysTogether}
            </h3>

            <p>Days Together</p>
          </div>

          <div
            className={
              styles.memoryCard
            }
          >
            <div
              className={
                styles.heart
              }
            >
              📖
            </div>

            <h3>
              One Story
            </h3>

            <p>Forever Growing</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default HeroSection;