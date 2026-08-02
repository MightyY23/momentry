import { motion } from "framer-motion";

import styles from "./MemoryInfo.module.css";

function MemoryInfo({ moment }) {
  const description =
    moment.description || "";

  const words = description
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const characters =
    description.length;

  const readingTime = Math.max(
    1,
    Math.ceil(words / 200)
  );

  const insights = [
    {
      icon: "📝",
      title: "Words",
      value: words,
    },
    {
      icon: "⌛",
      title: "Read Time",
      value: `${readingTime} min`,
    },
    {
      icon: "🔤",
      title: "Characters",
      value: characters,
    },
    {
      icon: moment.image_url
        ? "🖼️"
        : "📄",
      title: "Photo",
      value: moment.image_url
        ? "Attached"
        : "None",
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.badge}>
          📊 Insights
        </span>

        <h2>
          Memory Insights
        </h2>

        <p>
          Quick statistics about
          this memory.
        </p>
      </div>

      <div className={styles.grid}>
        {insights.map(
          (item, index) => (
            <motion.div
              key={item.title}
              className={styles.card}
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
                delay:
                  index * 0.08,
              }}
              whileHover={{
                y: -6,
              }}
            >
              <div
                className={styles.icon}
              >
                {item.icon}
              </div>

              <h3>
                {item.value}
              </h3>

              <p>
                {item.title}
              </p>
            </motion.div>
          )
        )}
      </div>
    </section>
  );
}

export default MemoryInfo;