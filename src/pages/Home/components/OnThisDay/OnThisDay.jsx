import { useMemo, useState } from "react";

import styles from "./OnThisDay.module.css";

/**
 * "On this day" — surfaces a memory that
 * happened on the same calendar day in a
 * previous year. Pure client-side filter;
 * nothing shows when there's no match.
 */
function OnThisDay({
  moments,
  onOpenMoment,
}) {
  const [dismissed, setDismissed] =
    useState(false);

  const memory = useMemo(() => {
    if (!moments?.length) return null;

    const now = new Date();

    const sameDay = (iso) => {
      const d = new Date(iso);

      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth()
      );
    };

    // Only memories from previous years.
    return (
      moments.find((m) => {
        const d = new Date(m.memory_date);

        return (
          sameDay(m.memory_date) &&
          d.getFullYear() < now.getFullYear()
        );
      }) || null
    );
  }, [moments]);

  if (!memory || dismissed) return null;

  const yearsAgo =
    new Date().getFullYear() -
    new Date(memory.memory_date).getFullYear();

  return (
    <section
      className={styles.card}
      aria-label="On this day"
    >
      <div className={styles.glowOne} />

      <div className={styles.glowTwo} />

      <div className={styles.content}>
        <span className={styles.badge}>
          ✨ On this day · {yearsAgo}{" "}
          year{yearsAgo === 1 ? "" : "s"} ago
        </span>

        {memory.image_url && (
          <img
            src={memory.image_url}
            alt=""
            loading="lazy"
            className={styles.photo}
          />
        )}

        <h3>{memory.title}</h3>

        {memory.location && (
          <p className={styles.location}>
            📍 {memory.location}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.openButton}
            onClick={() =>
              onOpenMoment?.(memory.id)
            }
          >
            Relive it →
          </button>

          <button
            type="button"
            className={styles.dismiss}
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </section>
  );
}

export default OnThisDay;
