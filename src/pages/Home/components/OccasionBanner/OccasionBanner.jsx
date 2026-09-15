import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  getUpcomingOccasions,
} from "../../../../services/occasions/getUpcomingOccasions";

import styles from "./OccasionBanner.module.css";

/**
 * Celebration banner for the Home dashboard —
 * surfaces upcoming birthdays and the story
 * anniversary with quick actions the partner
 * can take right away.
 */
function OccasionBanner({ onAddMemory }) {
  const navigate = useNavigate();

  const [occasions, setOccasions] =
    useState([]);

  useEffect(() => {
    let cancelled = false;

    getUpcomingOccasions(30)
      .then((list) => {
        if (!cancelled) {
          setOccasions(list ?? []);
        }
      })
      .catch(() => {
        /* Occasions are a delight feature —
           never block the dashboard. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (occasions.length === 0) {
    return null;
  }

  const o = occasions[0];

  const timing = o.isToday
    ? "today!"
    : o.daysUntil === 1
      ? "tomorrow!"
      : `in ${o.daysUntil} days`;

  const emoji =
    o.kind === "birthday" ? "🎂" : "💕";

  const title = o.isToday
    ? o.kind === "birthday"
      ? `${o.label} is ${timing}`
      : `Happy ${o.label.toLowerCase()} ${timing}`
    : `${o.label} is ${timing}`;

  return (
    <motion.section
      className={
        o.isToday
          ? `${styles.banner} ${styles.today}`
          : styles.banner
      }
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label={title}
    >
      <div className={styles.text}>
        <span className={styles.emoji}>
          {emoji}
        </span>

        <div>
          <strong>{title}</strong>

          <span className={styles.sub}>
            {o.kind === "birthday"
              ? "Plan a memory or open your StoryBook to celebrate."
              : "Add a memory from this year together — or reread your story."}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() =>
            onAddMemory?.() ??
            navigate("/add-moment")
          }
        >
          ➕ Plan a memory
        </button>

        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() =>
            navigate("/storybook")
          }
        >
          📖 Open StoryBook
        </button>
      </div>
    </motion.section>
  );
}

export default OccasionBanner;
