import { motion } from "framer-motion";
import {
  Heart,
  Download,
  Share2,
  MapPin,
} from "lucide-react";

import styles from "./GalleryCard.module.css";
import useNotification from "../../../hooks/useNotification";
import useMoments from "../../../hooks/useMoments";

function GalleryCard({
  moment,
  onClick,
}) {
  const notify = useNotification();

  const { favoriteMoment } =
    useMoments();
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
      notify.error(
        "Sharing not supported",
        "Your browser doesn't support native sharing."
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

  async function handleFavorite(e) {
    e.stopPropagation();

    try {
      await favoriteMoment(
        moment.id
      );
    } catch (error) {
      console.error(error);

      notify.error(
        "Unable to update favorite",
        "Please try again."
      );
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
        onError={(e) => {
          if (
            e.currentTarget.src !==
            "https://placehold.co/600x800?text=Memory"
          ) {
            e.currentTarget.src =
              "https://placehold.co/600x800?text=Memory";
          }
        }}
      />

      {/* Favorite ribbon (always visible) */}

      {moment.is_favorite && (
        <div
          className={styles.favorite}
          aria-label="Favorite memory"
        >
          ❤️
        </div>
      )}

      {/* Caption bar — photo stays the
          hero; info lives in a slim strip. */}

      <div className={styles.caption}>
        <div className={styles.captionText}>
          <h3>{moment.title}</h3>

          <div className={styles.location}>
            {moment.location && (
              <>
                <MapPin size={12} />

                {moment.location}
              </>
            )}

            <span>
              {new Date(
                moment.memory_date
              ).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={handleFavorite}
            aria-label={
              moment.is_favorite
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Heart
              size={17}
              fill={
                moment.is_favorite
                  ? "#ff5c8d"
                  : "none"
              }
            />
          </button>

          <button
            className={styles.actionBtn}
            onClick={handleDownload}
            aria-label="Download photo"
          >
            <Download size={17} />
          </button>

          <button
            className={styles.actionBtn}
            onClick={handleShare}
            aria-label="Share memory"
          >
            <Share2 size={17} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default GalleryCard;