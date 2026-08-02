import { motion } from "framer-motion";

import styles from "./PlaceRow.module.css";

function PlaceRow({
  rank,
  place,
  count,
  max,
  delay,
}) {
  const width = (count / max) * 100;

  const medals = [
    "🥇",
    "🥈",
    "🥉",
  ];

  return (
    <motion.div
      className={styles.row}
      initial={{
        opacity: 0,
        x: -30,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        delay,
      }}
    >
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={styles.rank}>
            {medals[rank] ||
              `${rank + 1}.`}
          </span>

          <span className={styles.place}>
            {place}
          </span>
        </div>

        <span className={styles.count}>
          {count} memories
        </span>
      </div>

      <div className={styles.track}>
        <motion.div
          className={styles.bar}
          initial={{
            width: 0,
          }}
          animate={{
            width: `${width}%`,
          }}
          transition={{
            duration: 0.8,
            delay,
          }}
        />
      </div>
    </motion.div>
  );
}

export default PlaceRow;