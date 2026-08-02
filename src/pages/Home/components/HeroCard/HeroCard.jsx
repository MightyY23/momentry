import { useMemo } from "react";

import styles from "./HeroCard.module.css";

function HeroCard({
  story,
  anniversaryDate,
}) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";

    if (hour < 18) return "Good Afternoon";

    return "Good Evening";
  }, []);

  const daysTogether = useMemo(() => {
    if (!anniversaryDate) return 0;

    const start = new Date(anniversaryDate);

    const today = new Date();

    const diff =
      today.getTime() -
      start.getTime();

    return Math.floor(
      diff / (1000 * 60 * 60 * 24)
    );
  }, [anniversaryDate]);

  return (
    <div className={styles.hero}>
      <div className={styles.overlay} />

      <div className={styles.content}>
        <p className={styles.greeting}>
          ❤️ {greeting}
        </p>

        <h1 className={styles.title}>
          {story?.title || "Our Story"}
        </h1>

        <p className={styles.subtitle}>
          Welcome back.
        </p>

        <div className={styles.days}>
          <span className={styles.number}>
            {daysTogether}
          </span>

          <span className={styles.label}>
            Days Together
          </span>
        </div>

        <p className={styles.quote}>
          Every memory deserves
          to be remembered forever.
        </p>
      </div>
    </div>
  );
}

export default HeroCard;