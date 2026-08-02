import { motion } from "framer-motion";

import styles from "./Achievements.module.css";

function AchievementCard({
  achievement,
  delay = 0,
}) {
  return (
    <motion.div
      className={
        achievement.unlocked
          ? styles.card
          : styles.locked
      }
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
        scale: 1.04,
      }}
    >
      <div className={styles.icon}>
        {achievement.icon}
      </div>

      <h3>{achievement.title}</h3>

      <p>{achievement.description}</p>

      <span>
        {achievement.unlocked
          ? "✅ Unlocked"
          : "🔒 Locked"}
      </span>
    </motion.div>
  );
}

export default AchievementCard;