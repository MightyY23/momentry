import { motion } from "framer-motion";

import styles from "./TimelineYear.module.css";

function TimelineYear({
  year,
  moments,
  delay = 0,
}) {
  return (
    <motion.div
      className={styles.year}
      initial={{
        opacity: 0,
        x: -30,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        delay,
      }}
    >
      <div className={styles.left}>
        <div className={styles.circle}>
          ❤️
        </div>

        <div className={styles.line}></div>
      </div>

      <div className={styles.content}>
        <h2>{year}</h2>

        <p>
          {moments.length} memories
        </p>

        <div className={styles.memories}>
          {moments
            .slice(0, 4)
            .map((moment) => (
              <div
                key={moment.id}
                className={styles.memory}
              >
                • {moment.title}
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

export default TimelineYear;