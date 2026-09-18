import { motion } from "framer-motion";
import { useMemo } from "react";

import styles from "./AnniversaryCountdown.module.css";

/**
 * Anniversary countdown — a celebratory
 * full-width strip showing how many days
 * until the next anniversary of the day
 * the relationship began. Hidden entirely
 * when no anniversary date exists.
 */
function AnniversaryCountdown({
  anniversaryDate,
}) {
  const data = useMemo(() => {
    if (!anniversaryDate) return null;

    const start = new Date(
      anniversaryDate
    );

    if (Number.isNaN(start.getTime()))
      return null;

    const today = new Date();

    const daysTogether = Math.max(
      0,
      Math.floor(
        (today - start) /
          (1000 * 60 * 60 * 24)
      )
    );

    const next = new Date(
      today.getFullYear(),
      start.getMonth(),
      start.getDate()
    );

    if (next < today) {
      next.setFullYear(
        next.getFullYear() + 1
      );
    }

    const daysLeft = Math.ceil(
      (next - today) /
        (1000 * 60 * 60 * 24)
    );

    const isToday =
      today.getMonth() ===
        start.getMonth() &&
      today.getDate() ===
        start.getDate() &&
      daysTogether > 0;

    const years =
      next.getFullYear() -
      start.getFullYear();

    const yearsCelebrating = next < today
      ? years
      : years - 1;

    return {
      daysTogether,
      daysLeft,
      isToday,
      yearsCelebrating,
      nextLabel: next.toLocaleDateString(
        undefined,
        {
          weekday: "long",
          month: "long",
          day: "numeric",
        }
      ),
    };
  }, [anniversaryDate]);

  if (!data) return null;

  return (
    <motion.section
      className={
        data.isToday
          ? `${styles.strip} ${styles.todayStrip}`
          : styles.strip
      }
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={styles.sparkleOne}
        aria-hidden="true"
      >
        ✨
      </div>

      <div
        className={styles.sparkleTwo}
        aria-hidden="true"
      >
        💫
      </div>

      {data.isToday ? (
        <>
          <span className={styles.badge}>
            🎊 Today is the day
          </span>

          <h2 className={styles.headline}>
            Happy{" "}
            {data.yearsCelebrating > 0
              ? ordinal(
                  data.yearsCelebrating
                )
              : ""}{" "}
            Anniversary!
          </h2>

          <p className={styles.sub}>
            {data.daysTogether} days of us —
            celebrate your{" "}
            {data.yearsCelebrating}
            {suffix(data.yearsCelebrating)}{" "}
            year
            {data.yearsCelebrating === 1
              ? ""
              : "s"}{" "}
            together today.
          </p>
        </>
      ) : (
        <>
          <span className={styles.badge}>
            🎉 Anniversary countdown
          </span>

          <div
            className={styles.countRow}
          >
            <div
              className={styles.countBlock}
            >
              <strong>
                {data.daysLeft}
              </strong>

              <span>
                day
                {data.daysLeft === 1
                  ? ""
                  : "s"}{" "}
                to go
              </span>
            </div>

            <div
              className={styles.countMeta}
            >
              <h2 className={styles.headline}>
                Our next anniversary
              </h2>

              <p className={styles.sub}>
                {data.nextLabel}
                {data.yearsCelebrating >
                  0 &&
                  ` · ${data.yearsCelebrating}${suffix(
                    data
                      .yearsCelebrating
                  )} year of us`}
              </p>
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}

function ordinal(n) {
  const s = suffix(n);

  return `${n}${s}`;
}

function suffix(n) {
  if (n % 100 >= 11 && n % 100 <= 13)
    return "th";

  switch (n % 10) {
    case 1:
      return "st";

    case 2:
      return "nd";

    case 3:
      return "rd";

    default:
      return "th";
  }
}

export default AnniversaryCountdown;
