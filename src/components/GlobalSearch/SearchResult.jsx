import { useNavigate } from "react-router-dom";

import styles from "./SearchResult.module.css";

function SearchResult({ memory }) {
  const navigate = useNavigate();

  return (
    <div
      className={styles.card}
      onClick={() =>
        navigate(`/moment/${memory.id}`)
      }
    >
      <div className={styles.header}>
        <h3>{memory.title}</h3>

        {memory.is_favorite && (
          <span className={styles.favorite}>
            ⭐
          </span>
        )}
      </div>

      {memory.location && (
        <p>
          📍 {memory.location}
        </p>
      )}

      <p className={styles.description}>
        {memory.description?.slice(
          0,
          120
        )}
      </p>

      <span className={styles.date}>
        {new Date(
          memory.memory_date
        ).toLocaleDateString()}
      </span>
    </div>
  );
}

export default SearchResult;