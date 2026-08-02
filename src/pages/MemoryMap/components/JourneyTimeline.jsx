import { motion } from "framer-motion";

import styles from "./JourneyTimeline.module.css";

function JourneyTimeline({
  moments,
  selected,
  onSelect,
}) {
  const sorted = [...moments].sort(
    (a, b) =>
      new Date(a.memory_date) -
      new Date(b.memory_date)
  );

  return (
    <aside className={styles.timeline}>
      <div className={styles.header}>
        <h2>❤️ Journey</h2>

        <span>
          {sorted.length} Memories
        </span>
      </div>

      <div className={styles.list}>
        {sorted.length === 0 ? (
          <p>No memories yet.</p>
        ) : (
          sorted.map((moment, index) => (
            <motion.div
              key={moment.id}
              initial={{
                opacity: 0,
                x: -30,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              className={`${styles.item} ${
                selected === moment.id
                  ? styles.active
                  : ""
              }`}
              onClick={() =>
                onSelect(moment)
              }
            >
              <div className={styles.left}>
                <div
                  className={styles.dot}
                />

                {index !==
                  sorted.length - 1 && (
                  <div
                    className={styles.line}
                  />
                )}
              </div>

              <div
                className={styles.content}
              >
                {moment.image_url && (
                  <img
                    src={
                      moment.image_url
                    }
                    alt={moment.title}
                    className={
                      styles.thumbnail
                    }
                  />
                )}

                <div>
                  <h4>
                    {moment.title}
                  </h4>

                  <p>
                    📍{" "}
                    {moment.location ||
                      "Unknown"}
                  </p>

                  <span>
                    {new Date(moment.memory_date).toLocaleDateString(undefined,{
                        day:"numeric",
                        month:"short",
                        year:"numeric",
                    })}
                </span>
                </div>

                {moment.is_favorite && (
                  <div
                    className={
                      styles.favorite
                    }
                  >
                    ❤️
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </aside>
  );
}

export default JourneyTimeline;