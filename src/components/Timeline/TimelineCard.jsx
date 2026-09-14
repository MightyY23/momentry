import { motion } from "framer-motion";

import styles from "./TimelineCard.module.css";

function TimelineCard({
  moment,
  onClick,
  onToggleFavorite,
}) {
  const memoryDate = new Date(moment.memory_date);

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

  return (
    <motion.article
      className={styles.card}
      whileHover={{
        y: -8,
        scale: 1.015,
      }}
      transition={{
        duration: 0.25,
      }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" ||
          e.key === " "
        ) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* ===========================
            IMAGE
      =========================== */}

      <div className={styles.imageWrapper}>
        <img
          src={
            moment.image_url ||
            "https://placehold.co/900x600?text=Memory"
          }
          alt={moment.title}
          className={styles.image}
        />

        <div className={styles.overlay} />

        {moment.is_favorite && (
          <div className={styles.favorite}>
            ❤️ Favorite
          </div>
        )}

        <div className={styles.dateBadge}>
          <span className={styles.day}>
            {memoryDate.getDate()}
          </span>

          <span className={styles.month}>
            {memoryDate
              .toLocaleString("default", {
                month: "short",
              })
              .toUpperCase()}
          </span>
        </div>
      </div>

      {/* ===========================
            CONTENT
      =========================== */}

      <div className={styles.content}>
        <div className={styles.header}>
          <h3>{moment.title}</h3>

          {moment.location && (
            <span
              className={
                styles.location
              }
            >
              📍 {moment.location}
            </span>
          )}
        </div>

        <p className={styles.date}>
          {formattedDate}
        </p>

        <p
          className={
            styles.description
          }
        >
          {moment.description ||
            "A beautiful memory waiting to be remembered forever."}
        </p>

       <div className={styles.actions}>
        <button
          className={styles.readButton}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Read More →
        </button>

        <button
          className={styles.favoriteButton}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(moment);
          }}
        >
          {moment.is_favorite
            ? "💔 Unfavorite"
            : "❤️ Favorite"}
        </button>
      </div>
      </div>
    </motion.article>
  );
}

export default TimelineCard;