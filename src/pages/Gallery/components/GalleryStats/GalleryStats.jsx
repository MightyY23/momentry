import { motion } from "framer-motion";
import {
  Images,
  Heart,
  MapPin,
  CalendarDays,
} from "lucide-react";

import styles from "./GalleryStats.module.css";

function GalleryStats({ moments }) {
  const total = moments.length;

  const favorites = moments.filter(
    (m) => m.is_favorite
  ).length;

  const places = new Set(
    moments
      .filter((m) => m.location)
      .map((m) => m.location)
  ).size;

  const years = new Set(
    moments.map((m) =>
      new Date(
        m.memory_date
      ).getFullYear()
    )
  ).size;

  const cards = [
    {
      icon: Images,
      title: "Total Memories",
      value: total,
      color: styles.pink,
    },
    {
      icon: Heart,
      title: "Favorites",
      value: favorites,
      color: styles.red,
    },
    {
      icon: MapPin,
      title: "Places Visited",
      value: places,
      color: styles.orange,
    },
    {
      icon: CalendarDays,
      title: "Years Captured",
      value: years,
      color: styles.blue,
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {cards.map(
          (
            card,
            index
          ) => {
            const Icon =
              card.icon;

            return (
              <motion.div
                key={
                  card.title
                }
                className={
                  styles.card
                }
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: .4,
                  delay:
                    index *
                    .08,
                }}
                whileHover={{
                  y: -8,
                }}
              >
                <div
                  className={`${styles.icon} ${card.color}`}
                >
                  <Icon
                    size={28}
                  />
                </div>

                <div
                  className={
                    styles.content
                  }
                >
                  <h2>
                    {card.value}
                  </h2>

                  <p>
                    {card.title}
                  </p>
                </div>
              </motion.div>
            );
          }
        )}
      </div>
    </section>
  );
}

export default GalleryStats;