import { motion } from "framer-motion";

import styles from "./HighlightCard.module.css";

function HighlightCard({
  icon,
  title,
  value,
  subtitle,
  delay = 0,
}) {
  return (
    <motion.div
      className={styles.card}
      initial={{
        opacity: 0,
        y: 25,
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

      {subtitle && (
        <p>{subtitle}</p>
      )}
    </motion.div>
  );
}

export default HighlightCard;