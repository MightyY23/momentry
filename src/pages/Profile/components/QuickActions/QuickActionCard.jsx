import { motion } from "framer-motion";

import styles from "./QuickActions.module.css";

function QuickActionCard({
  icon,
  title,
  subtitle,
  onClick,
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
      onClick={onClick}
    >
      <div className={styles.icon}>
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{subtitle}</p>
    </motion.div>
  );
}

export default QuickActionCard;