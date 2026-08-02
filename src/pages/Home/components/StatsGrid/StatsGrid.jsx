import { motion } from "framer-motion";
import styles from "./StatsGrid.module.css";

function StatsGrid({
  moments,
  anniversaryDate,
}) {
  const favorites = moments.filter(
    (m) => m.is_favorite
  ).length;

  const places = new Set(
    moments
      .map((m) => m.location)
      .filter(Boolean)
  ).size;

  let daysTogether = 0;

  if (anniversaryDate) {
    const start = new Date(anniversaryDate);
    const today = new Date();

    daysTogether = Math.floor(
      (today - start) /
        (1000 * 60 * 60 * 24)
    );
  }

  const stats = [
    {
      icon: "📸",
      value: moments.length,
      label: "Memories",
      color: styles.pink,
    },
    {
      icon: "❤️",
      value: favorites,
      label: "Favorites",
      color: styles.red,
    },
    {
      icon: "📍",
      value: places,
      label: "Places Visited",
      color: styles.blue,
    },
    {
      icon: "⏳",
      value: daysTogether,
      label: "Days Together",
      color: styles.purple,
    },
  ];

  return (
    <section className={styles.section}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
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
            delay: index * 0.08,
            duration: 0.4,
          }}
          whileHover={{
            y: -8,
          }}
        >
          <div
            className={`${styles.icon} ${stat.color}`}
          >
            {stat.icon}
          </div>

          <div className={styles.info}>
            <h2>{stat.value}</h2>

            <p>{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

export default StatsGrid;