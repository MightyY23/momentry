import { motion } from "framer-motion";

import styles from "./MomentMeta.module.css";

function MomentMeta({ moment }) {
  const memoryDate = new Date(
    moment.memory_date
  );

  const formattedDate =
    memoryDate.toLocaleDateString(
      undefined,
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  const year =
    memoryDate.getFullYear();

  const cards = [
    {
      icon: "📅",
      title: "Memory Date",
      value: formattedDate,
    },
    {
      icon: "📍",
      title: "Location",
      value:
        moment.location ||
        "No location added",
    },
    {
      icon: "❤️",
      title: "Favorite",
      value: moment.is_favorite
        ? "Yes"
        : "No",
    },
    {
      icon: "🗓️",
      title: "Year",
      value: year,
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.badge}>
          ℹ️ Memory Details
        </span>

        <h2>About this Memory</h2>
      </div>

      <div className={styles.grid}>
        {cards.map(
          (card, index) => (
            <motion.div
              key={card.title}
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
                {card.icon}
              </div>

              <div
                className={
                  styles.content
                }
              >
                <span
                  className={
                    styles.label
                  }
                >
                  {card.title}
                </span>

                <strong>
                  {card.value}
                </strong>
              </div>
            </motion.div>
          )
        )}
      </div>
    </section>
  );
}

export default MomentMeta;