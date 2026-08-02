import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Button from "../../../../ui/Button/Button";

import styles from "./DashboardFeed.module.css";

function DashboardFeed({ moments }) {
  const navigate = useNavigate();

  const today = new Date();

  const onThisDay = moments.find((moment) => {
    const date = new Date(moment.memory_date);

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() !== today.getFullYear()
    );
  });

  const favorite = moments.find(
    (moment) => moment.is_favorite
  );

  if (!onThisDay && !favorite) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.badge}>
          ✨ Highlights
        </span>

        <h2>Memory Highlights</h2>

        <p>
          Rediscover the moments that
          make your story special.
        </p>
      </div>

      <div className={styles.grid}>

        {onThisDay && (
          <motion.article
            className={styles.card}
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            whileHover={{
              y: -8,
            }}
          >
            <div className={styles.image}>
              <img
                src={onThisDay.image_url}
                alt={onThisDay.title}
              />

              <div className={styles.imageBadge}>
                ❤️ On This Day
              </div>
            </div>

            <div className={styles.body}>
              <h3>
                {onThisDay.title}
              </h3>

              <p>
                You created this memory on{" "}
                {new Date(
                  onThisDay.memory_date
                ).toLocaleDateString(
                  undefined,
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </p>

              <Button
                onClick={() =>
                  navigate(
                    `/moment/${onThisDay.id}`
                  )
                }
              >
                Open Memory
              </Button>
            </div>
          </motion.article>
        )}

        {favorite && (
          <motion.article
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
              delay: .15,
            }}
            whileHover={{
              y: -8,
            }}
          >
            <div className={styles.image}>
              <img
                src={favorite.image_url}
                alt={favorite.title}
              />

              <div className={styles.imageBadge}>
                🔥 Favorite
              </div>
            </div>

            <div className={styles.body}>
              <h3>
                {favorite.title}
              </h3>

              <p>
                {favorite.description}
              </p>

              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    `/moment/${favorite.id}`
                  )
                }
              >
                View Favorite
              </Button>
            </div>
          </motion.article>
        )}

      </div>
    </section>
  );
}

export default DashboardFeed;