import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./HeroImage.module.css";

function HeroImage({
  image,
  title,
}) {
  const [zoomed, setZoomed] =
    useState(false);

  const displayImage =
    image ||
    "https://placehold.co/1600x900?text=Memory";

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") {
        setZoomed(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleEscape
      );
  }, []);

  return (
    <>
      <motion.section
        className={styles.hero}
        initial={{
          opacity: 0,
          y: 35,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
        }}
      >
        <img
          src={displayImage}
          alt={title}
          className={styles.image}
          onClick={() =>
            setZoomed(true)
          }
        />

        <div className={styles.gradient} />

        <div className={styles.content}>
          <div className={styles.badge}>
            📸 Memory
          </div>

          <h1>{title}</h1>

          <p>
            Click the image to
            view it in fullscreen.
          </p>
        </div>

        <button
          className={styles.zoomButton}
          onClick={() =>
            setZoomed(true)
          }
        >
          🔍
        </button>
      </motion.section>

      <AnimatePresence>
        {zoomed && (
          <motion.div
            className={
              styles.fullscreen
            }
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() =>
              setZoomed(false)
            }
          >
            <motion.img
              src={displayImage}
              alt={title}
              initial={{
                scale: 0.9,
              }}
              animate={{
                scale: 1,
              }}
              exit={{
                scale: 0.9,
              }}
              transition={{
                duration: 0.3,
              }}
            />

            <button
              className={
                styles.close
              }
              onClick={() =>
                setZoomed(false)
              }
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default HeroImage;