import { motion } from "framer-motion";
import {
  Heart,
  Download,
  Share2,
  MapPin,
  CalendarDays,
} from "lucide-react";

import styles from "./GalleryCard.module.css";

function GalleryCard({
  moment,
  onClick,
}) {
  //---------------------------------------
  // Download
  //---------------------------------------

  function handleDownload(e) {
    e.stopPropagation();

    const link =
      document.createElement("a");

    link.href = moment.image_url;
    link.download =
      moment.title || "memory";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  //---------------------------------------

  async function handleShare(e) {
    e.stopPropagation();

    if (!navigator.share) {
      alert(
        "Sharing isn't supported."
      );
      return;
    }

    try {
      await navigator.share({
        title: moment.title,
        text: moment.description,
        url: window.location.href,
      });
    } catch (error) {
      console.error(error);
    }
  }

  //---------------------------------------

  return (
    <motion.article
      layout
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{
        duration: 0.28,
      }}
      className={styles.card}
      onClick={onClick}
    >
      <img
        loading="lazy"
        src={
          moment.image_url ||
          "https://placehold.co/600x800?text=Memory"
        }
        alt={moment.title}
        className={styles.image}
      />

      {/* Favorite */}

      {moment.is_favorite && (
        <div
          className={styles.favorite}
        >
          ❤️
        </div>
      )}

      {/* Date */}

      <div className={styles.date}>
        <CalendarDays
          size={14}
        />

        {new Date(
          moment.memory_date
        ).toLocaleDateString()}
      </div>

      {/* Overlay */}

      <div className={styles.overlay}>
        <div
          className={
            styles.content
          }
        >
          <h3>{moment.title}</h3>

          {moment.location && (
            <div
              className={
                styles.location
              }
            >
              <MapPin
                size={15}
              />

              {moment.location}
            </div>
          )}
        </div>

        <div
          className={
            styles.actions
          }
        >
          <button
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <Heart
              size={18}
              fill={
                moment.is_favorite
                  ? "#ff5c8d"
                  : "none"
              }
            />
          </button>

          <button
            onClick={
              handleDownload
            }
          >
            <Download
              size={18}
            />
          </button>

          <button
            onClick={
              handleShare
            }
          >
            <Share2
              size={18}
            />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default GalleryCard;