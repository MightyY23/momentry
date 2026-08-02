import { motion } from "framer-motion";

import styles from "./ReadingProgress.module.css";

function ProgressCard({
  icon,
  title,
  value,
  delay = 0,
}) {
  return (
    <motion.div
      className={styles.card}
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.4,
        delay,
      }}
      whileHover={{
        y: -5,
      }}
    >
      <div className={styles.icon}>
        {icon}
      </div>

      <h3>{value}</h3>

      <p>{title}</p>
    </motion.div>
  );
}

export default ProgressCard;