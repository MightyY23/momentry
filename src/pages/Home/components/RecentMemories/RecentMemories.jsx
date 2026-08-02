import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Button from "../../../../ui/Button/Button";

import styles from "./RecentMemories.module.css";

function RecentMemories({ moments }) {
  const navigate = useNavigate();

  const recent = [...moments]
    .sort(
      (a, b) =>
        new Date(b.memory_date) -
        new Date(a.memory_date)
    )
    .slice(0, 6);

  if (!recent.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <span className={styles.badge}>
            📸 Gallery
          </span>

          <h2>
            Recent Memories
          </h2>

          <p>
            Your latest moments together.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() =>
            navigate("/gallery")
          }
        >
          View Gallery →
        </Button>
      </div>

      <div className={styles.grid}>
        {recent.map(
          (moment, index) => (
            <motion.div
              key={moment.id}
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
              }}
              whileHover={{
                y: -10,
              }}
              onClick={() =>
                navigate(
                  `/moment/${moment.id}`
                )
              }
            >
              <img
                src={
                  moment.image_url ||
                  "https://placehold.co/700x700?text=Memory"
                }
                alt={moment.title}
              />

              <div
                className={
                  styles.overlay
                }
              >
                {moment.is_favorite && (
                  <div
                    className={
                      styles.favorite
                    }
                  >
                    ❤️
                  </div>
                )}

                {moment.location && (
                  <div
                    className={
                      styles.location
                    }
                  >
                    📍{" "}
                    {
                      moment.location
                    }
                  </div>
                )}

                <div
                  className={
                    styles.content
                  }
                >
                  <h3>
                    {moment.title}
                  </h3>

                  <p>
                    {new Date(
                      moment.memory_date
                    ).toLocaleDateString(
                      undefined,
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        )}
      </div>
    </section>
  );
}

export default RecentMemories;