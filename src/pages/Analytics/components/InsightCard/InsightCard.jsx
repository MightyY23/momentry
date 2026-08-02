import { motion } from "framer-motion";

import styles from "./InsightCard.module.css";

function InsightCard({
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
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay,
      }}
    >
      <div className={styles.icon}>
        {icon}
      </div>

      <h3>{title}</h3>

      <h2>{value}</h2>
    </motion.div>
  );
}

export default InsightCard;