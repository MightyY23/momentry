import { motion } from "framer-motion";

import styles from "./ProfileStats.module.css";

function StatCard({
  icon,
  value,
  label,
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
        y: -8,
        scale: 1.03,
      }}
    >
      <div className={styles.icon}>
        {icon}
      </div>

      <h2>{value}</h2>

      <p>{label}</p>
    </motion.div>
  );
}

export default StatCard;