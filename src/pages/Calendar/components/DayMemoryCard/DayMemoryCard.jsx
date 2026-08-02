import { useNavigate } from "react-router-dom";

import styles from "./DayMemoryCard.module.css";

function DayMemoryCard({ moment }) {
  const navigate = useNavigate();

  const description =
    moment.description || "";

  return (
    <article className={styles.card}>
      {moment.image_url && (
        <div className={styles.imageWrapper}>
          <img
            src={moment.image_url}
            alt={moment.title}
            className={styles.image}
          />

          {moment.is_favorite && (
            <div
              className={
                styles.favoriteBadge
              }
            >
              ❤️
            </div>
          )}
        </div>
      )}

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

        {description && (
          <p
            className={
              styles.description
            }
          >
            {description.length > 150
              ? `${description.slice(
                  0,
                  150
                )}...`
              : description}
          </p>
        )}

        <button
          type="button"
          className={styles.button}
          onClick={() =>
            navigate(
              `/moment/${moment.id}`
            )
          }
        >
          View Memory →
        </button>
      </div>
    </article>
  );
}

export default DayMemoryCard;