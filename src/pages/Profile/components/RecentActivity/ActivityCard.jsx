import { motion } from "framer-motion";

import styles from "./RecentActivity.module.css";

function ActivityCard({
  moment,
  delay = 0,
  onOpen,
}) {
  return (
    <motion.div
      className={styles.card}
      initial={{
        opacity: 0,
        x: -20,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.35,
        delay,
      }}
      whileHover={{
        x: 8,
      }}
      onClick={() => onOpen(moment.id)}
    >
      <img
        src={
          moment.image_url ||
          "https://placehold.co/120x120?text=❤️"
        }
        alt={moment.title}
      />

      <div className={styles.content}>
        <h3>{moment.title}</h3>

        <p>
          {new Date(
            moment.memory_date
          ).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}

export default ActivityCard;