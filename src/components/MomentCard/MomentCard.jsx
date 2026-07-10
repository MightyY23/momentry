import { motion } from "framer-motion";
import styles from "./MomentCard.module.css";

function MomentCard({
  moment,
  onClick,
  onToggleFavorite,
}) {
  return (
    <motion.div
      className={styles.card}
      onClick={onClick}
      initial={{
        opacity: 0,
        y: 60,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.55,
      }}
      whileHover={{
        y: -10,
        scale: 1.02,
      }}
    >
      {moment.image_url && (
        <img
          src={moment.image_url}
          alt={moment.title}
          className={styles.image}
        />
      )}

      <button
        className={styles.favoriteButton}
        onClick={(e) => {
          e.stopPropagation();

          if (onToggleFavorite) {
            onToggleFavorite(moment);
          }
        }}
      >
        {moment.is_favorite ? "❤️" : "🤍"}
      </button>

      <div className={styles.content}>
        <h3>{moment.title}</h3>

        <p className={styles.date}>
          {new Date(
            moment.memory_date
          ).toLocaleDateString()}
        </p>

        <p className={styles.description}>
          {moment.description}
        </p>
      </div>
    </motion.div>
  );
}

export default MomentCard;