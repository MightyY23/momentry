
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import styles from "./RecentMemoryCard.module.css";

function RecentMemoryCard({ moment, index }) {
  const navigate = useNavigate();

  return (
    <motion.div
      className={styles.card}
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.08,
      }}
      whileHover={{
        y: -8,
      }}
      onClick={() =>
        navigate(`/moment/${moment.id}`)
      }
    >
      <img
        src={
          moment.image_url ||
          "https://placehold.co/500x350?text=Memory"
        }
        alt={moment.title}
      />

      <div className={styles.overlay}>
        {moment.is_favorite && (
          <span className={styles.favorite}>
            ❤️
          </span>
        )}

        <h3>{moment.title}</h3>

        <p>
          {new Date(
            moment.memory_date
          ).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}

export default RecentMemoryCard;