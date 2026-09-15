import { useNavigate } from "react-router-dom";

import styles from "./TimelineMemoryCard.module.css";

function TimelineMemoryCard({
  moment,
}) {
  const navigate = useNavigate();

  return (
    <div className={styles.card}>
      {moment.image_url ? (
        <img
          src={moment.image_url}
          alt={moment.title}
          className={styles.image}
        />
      ) : (
        <div className={styles.placeholder}>
          📷
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.top}>
          <h3>{moment.title}</h3>

          {moment.is_favorite && (
            <span className={styles.favorite}>
              ❤️
            </span>
          )}
        </div>

        {moment.location && (
          <p>
            📍 {moment.location}
          </p>
        )}

        <span className={styles.date}>
          📅{" "}
          {new Date(
            moment.memory_date
          ).toLocaleDateString(
            "default",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </span>

        {moment.description && (
          <p className={styles.description}>
            {moment.description.length > 140
              ? `${moment.description.slice(
                  0,
                  140
                )}...`
              : moment.description}
          </p>
        )}

        <button
          className={styles.cardButton}
          onClick={() =>
            navigate(`/moment/${moment.id}`)
          }
        >
          Open Memory →
        </button>
      </div>
    </div>
  );
}

export default TimelineMemoryCard;