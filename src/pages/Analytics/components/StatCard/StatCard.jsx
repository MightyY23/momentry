import { motion } from "framer-motion";

import styles from "./StatCard.module.css";

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
  delay = 0,
}) {
  return (
    <motion.div
      className={styles.card}
      initial={{
        opacity: 0,
        y: 30,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.45,
        delay,
        ease: "easeOut",
      }}
      whileHover={{
        y: -8,
      }}
    >
      <div
        className={styles.icon}
        style={{
          "--accent": color,
        }}
      >
        {icon}
      </div>

      <div className={styles.content}>
        <h2>{value}</h2>

        <h3>{title}</h3>

        {subtitle && (
          <p>{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

export default StatCard;