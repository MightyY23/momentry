import { motion } from "framer-motion";

import styles from "./Appearance.module.css";

function ThemeCard({
  emoji,
  title,
  active,
  onClick,
}) {
  return (
    <motion.div
      className={`${styles.card} ${
        active ? styles.active : ""
      }`}
      whileHover={{
        y: -6,
        scale: 1.03,
      }}
      onClick={onClick}
    >
      <div className={styles.icon}>
        {emoji}
      </div>

      <h3>{title}</h3>
    </motion.div>
  );
}

export default ThemeCard;