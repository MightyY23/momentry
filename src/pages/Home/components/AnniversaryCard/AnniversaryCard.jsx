import { motion } from "framer-motion";
import { useMemo } from "react";

import styles from "./AnniversaryCard.module.css";

function AnniversaryCard({
  anniversaryDate,
}) {
  const data = useMemo(() => {
    if (!anniversaryDate)
      return {
        daysTogether: 0,
        daysLeft: 0,
        nextDate: "",
        progress: 0,
      };

    const start = new Date(anniversaryDate);
    const today = new Date();

    const daysTogether = Math.floor(
      (today - start) /
        (1000 * 60 * 60 * 24)
    );

    const nextAnniversary = new Date(
      today.getFullYear(),
      start.getMonth(),
      start.getDate()
    );

    if (nextAnniversary < today) {
      nextAnniversary.setFullYear(
        today.getFullYear() + 1
      );
    }

    const daysLeft = Math.ceil(
      (nextAnniversary - today) /
        (1000 * 60 * 60 * 24)
    );

    const yearStart = new Date(
      nextAnniversary.getFullYear() - 1,
      start.getMonth(),
      start.getDate()
    );

    const totalYearDays = Math.ceil(
      (nextAnniversary - yearStart) /
        (1000 * 60 * 60 * 24)
    );

    const elapsed = Math.ceil(
      (today - yearStart) /
        (1000 * 60 * 60 * 24)
    );

    const progress = Math.min(
      100,
      Math.max(
        0,
        (elapsed / totalYearDays) * 100
      )
    );

    return {
      daysTogether,
      daysLeft,
      nextDate:
        nextAnniversary.toLocaleDateString(
          undefined,
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        ),
      progress,
    };
  }, [anniversaryDate]);

  return (
    <motion.section
      className={styles.card}
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: .5,
      }}
    >
      <span className={styles.badge}>
        ❤️ Milestone
      </span>

      <h2>
        Together For
      </h2>

      <div className={styles.counter}>
        {data.daysTogether}
      </div>

      <div className={styles.days}>
        Days
      </div>

      <div className={styles.divider} />

      <div className={styles.next}>
        <h3>
          🎉 Next Anniversary
        </h3>

        <div className={styles.remaining}>
          {data.daysLeft}
        </div>

        <span>
          Days Remaining
        </span>

        <p>
          {data.nextDate}
        </p>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressTop}>
          <span>
            This Year's Journey
          </span>

          <strong>
            {Math.round(
              data.progress
            )}
            %
          </strong>
        </div>

        <div className={styles.progress}>
          <motion.div
            className={styles.fill}
            initial={{
              width: 0,
            }}
            animate={{
              width: `${data.progress}%`,
            }}
            transition={{
              duration: 1,
            }}
          />
        </div>
      </div>
    </motion.section>
  );
}

export default AnniversaryCard;