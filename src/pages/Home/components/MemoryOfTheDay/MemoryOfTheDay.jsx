import { useMemo } from "react";

import { Link } from "react-router-dom";

import styles from "./MemoryOfTheDay.module.css";

// Day bucket computed once per page load —
// the pick stays stable for the whole day.
const DAY_SEED = Math.floor(Date.now() / 86400000);

/**
 * Memory of the Day — one memory, chosen
 * deterministically by today's date, so it
 * rotates daily and is the same all day.
 */
function MemoryOfTheDay({ moments }) {
  const pick = useMemo(() => {
    if (!moments?.length) return null;

    const withPhotos = moments.filter(
      (m) => m.image_url
    );

    const pool = withPhotos.length
      ? withPhotos
      : moments;

    return pool[DAY_SEED % pool.length];
  }, [moments]);

  if (!pick) return null;

  const date = pick.memory_date
    ? new Date(
        pick.memory_date
      ).toLocaleDateString(undefined, {
        month: "long",

        day: "numeric",

        year: "numeric",
      })
    : "";

  return (
    <Link
      to={`/moment/${pick.id}`}
      className={styles.card}
    >
      {pick.image_url && (
        <img
          src={pick.image_url}
          alt={pick.title}
          loading="lazy"
          className={styles.photo}
        />
      )}

      <div className={styles.scrim} />

      <div className={styles.body}>
        <span className={styles.tag}>
          💫 Memory of the Day
        </span>

        <h3 className={styles.title}>
          {pick.title}
        </h3>

        {date && (
          <span className={styles.date}>
            {date}
          </span>
        )}

        {pick.location && (
          <span className={styles.place}>
            📍 {pick.location}
          </span>
        )}
      </div>
    </Link>
  );
}

export default MemoryOfTheDay;
