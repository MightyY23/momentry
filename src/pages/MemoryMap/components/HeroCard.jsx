import { motion } from "framer-motion";

import styles from "./HeroCard.module.css";

function HeroCard({
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
        y: 25,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay,
        duration: 0.45,
        ease: "easeOut",
      }}
      whileHover={{
        y: -8,
      }}
    >
      <div className={styles.icon}>
        {icon}
      </div>

      <div className={styles.content}>
        <h2>{value}</h2>

        <p>{title}</p>
      </div>
    </motion.div>
  );
}

export default HeroCard;