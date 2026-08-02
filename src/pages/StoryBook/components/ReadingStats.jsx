import { motion } from "framer-motion";

import {
  BookOpen,
  Heart,
  Clock3,
  CalendarDays,
} from "lucide-react";

import styles from "./ReadingStats.module.css";

function ReadingStats({
  chapters,
  memories,
  createdAt,
}) {
  const readingTime = Math.max(
    1,
    Math.ceil(chapters * 2.5)
  );

  const created =
    createdAt
      ? new Date(createdAt)
      : null;

  const stats = [
    {
      icon: <BookOpen size={26} />,
      value: chapters,
      label: "Chapters",
    },
    {
      icon: <Heart size={26} />,
      value: memories,
      label: "Memories",
    },
    {
      icon: <Clock3 size={26} />,
      value: `${readingTime} min`,
      label: "Reading Time",
    },
    {
      icon: <CalendarDays size={26} />,
      value: created
        ? created.toLocaleDateString(
            "en-US",
            {
              month: "short",
              year: "numeric",
            }
          )
        : "—",
      label: "Story Started",
    },
  ];

  return (
    <section className={styles.grid}>
      {stats.map(
        (item, index) => (
          <motion.div
            key={item.label}
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
              delay:
                index * 0.08,
            }}
          >
            <div
              className={styles.icon}
            >
              {item.icon}
            </div>

            <div
              className={styles.content}
            >
              <h3>
                {item.value}
              </h3>

              <p>
                {item.label}
              </p>
            </div>
          </motion.div>
        )
      )}
    </section>
  );
}

export default ReadingStats;