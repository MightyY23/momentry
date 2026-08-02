import { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  CalendarDays,
  MapPin,
} from "lucide-react";

import styles from "./GalleryLightbox.module.css";

function GalleryLightbox({
  moments,
  index,
  onClose,
  onPrev,
  onNext,
}) {
  const moment = moments[index];

  const [playing, setPlaying] =
    useState(false);

  //---------------------------------------

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape")
        onClose();

      if (e.key === "ArrowLeft")
        onPrev();

      if (e.key === "ArrowRight")
        onNext();
    }

    window.addEventListener(
      "keydown",
      handleKey
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );

      document.body.style.overflow =
        "";
    };
  }, [onClose, onPrev, onNext]);

  //---------------------------------------

  useEffect(() => {
    if (!playing) return;

    const timer =
      setInterval(() => {
        onNext();
      }, 3500);

    return () =>
      clearInterval(timer);
  }, [playing, onNext]);

  //---------------------------------------

  if (!moment) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
      >
        {/* Close */}

        <button
          className={styles.close}
          onClick={onClose}
        >
          <X size={22} />
        </button>

        {/* Previous */}

        <button
          className={styles.prev}
          onClick={onPrev}
        >
          <ChevronLeft
            size={32}
          />
        </button>

        {/* Image */}

        <motion.img
          key={moment.id}
          src={moment.image_url}
          alt={moment.title}
          className={styles.image}
          initial={{
            opacity: 0,
            scale: .95,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: .35,
          }}
        />

        {/* Next */}

        <button
          className={styles.next}
          onClick={onNext}
        >
          <ChevronRight
            size={32}
          />
        </button>

        {/* Bottom Panel */}

        <motion.div
          className={styles.info}
          initial={{
            y: 80,
          }}
          animate={{
            y: 0,
          }}
        >
          <div
            className={styles.left}
          >
            <h2>
              {moment.title}
            </h2>

            <div
              className={
                styles.meta
              }
            >
              <span>
                <CalendarDays
                  size={15}
                />

                {new Date(
                  moment.memory_date
                ).toLocaleDateString()}
              </span>

              {moment.location && (
                <span>
                  <MapPin
                    size={15}
                  />

                  {
                    moment.location
                  }
                </span>
              )}

              {moment.is_favorite && (
                <span>
                  ❤️ Favorite
                </span>
              )}
            </div>

            <p>
              {
                moment.description
              }
            </p>
          </div>

          <button
            className={
              styles.play
            }
            onClick={() =>
              setPlaying(
                !playing
              )
            }
          >
            {playing ? (
              <>
                <Pause
                  size={18}
                />
                Pause
              </>
            ) : (
              <>
                <Play
                  size={18}
                />
                Slideshow
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GalleryLightbox;