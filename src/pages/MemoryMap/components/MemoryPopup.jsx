import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Heart,
  ArrowRight,
} from "lucide-react";

import { motion } from "framer-motion";

import styles from "./MemoryPopup.module.css";

function MemoryPopup({ moment }) {
  const navigate = useNavigate();

  const date = new Date(
    moment.memory_date
  ).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      className={styles.card}
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.25,
      }}
    >
      <div className={styles.imageWrapper}>
        <img
          src={
            moment.image_url ||
            "https://placehold.co/800x500?text=Memory"
          }
          alt={moment.title}
          className={styles.image}
        />

        <div className={styles.overlay} />

        {moment.is_favorite && (
          <div className={styles.favorite}>
            <Heart
              size={14}
              fill="white"
            />
            Favorite
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h3>{moment.title}</h3>

        <div className={styles.meta}>
          {moment.location && (
            <div className={styles.chip}>
              <MapPin size={14} />
              {moment.location}
            </div>
          )}

          <div className={styles.chip}>
            <Calendar size={14} />
            {date}
          </div>
        </div>

        {moment.description && (
          <p className={styles.description}>
            {moment.description.length >
            110
              ? `${moment.description.slice(
                  0,
                  110
                )}...`
              : moment.description}
          </p>
        )}

        <button
          className={styles.button}
          onClick={() =>
            navigate(
              `/moment/${moment.id}`
            )
          }
        >
          View Memory

          <ArrowRight size={17} />
        </button>
      </div>
    </motion.div>
  );
}

export default MemoryPopup;