import { useEffect, useRef, useState } from "react";
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
  Heart,
  Download,
  ArrowUpRight,
  Share2,
} from "lucide-react";

import styles from "./GalleryLightbox.module.css";

import useMoments from "../../../hooks/useMoments";
import useNotification from "../../../hooks/useNotification";

function GalleryLightbox({
  moments,
  index,
  onClose,
  onPrev,
  onNext,
  onOpenMoment,
}) {
  const moment = moments[index];

  const [playing, setPlaying] =
    useState(false);
  const { favoriteMoment } =
    useMoments();

  const notify = useNotification();

  //---------------------------------------
  // The slideshow only actually runs when
  // the play button was pressed while the
  // CURRENT list was showing. If the
  // filtered list changes under us, the
  // parent resets `index` anyway — we key
  // the interval to the list so stale
  // ticks never fire.
  //---------------------------------------

  const momentsKey = moments
    .map((m) => m.id)
    .join(",");

  const slideshowEnded =
    !playing ||
    index >= moments.length - 1;

  useEffect(() => {
    if (slideshowEnded) {
      return;
    }

    const timer =
      setInterval(() => {
        onNext();
      }, 3500);

    return () =>
      clearInterval(timer);
  }, [
    slideshowEnded,
    onNext,
    momentsKey,
  ]);

  //---------------------------------------
  // Keyboard + scroll lock
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
  // Swipe navigation (touch)
  //---------------------------------------

  const touchStartX = useRef(null);

  function handleTouchStart(e) {
    touchStartX.current =
      e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (
      touchStartX.current === null
    ) {
      return;
    }

    const deltaX =
      e.changedTouches[0].clientX -
      touchStartX.current;

    touchStartX.current = null;

    if (Math.abs(deltaX) < 60) {
      return;
    }

    if (deltaX < 0) {
      onNext();
    } else {
      onPrev();
    }
  }

  //---------------------------------------
  // Favorite
  //---------------------------------------

  async function handleFavorite() {
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
  // Download — direct first, then a
  // blob fallback (some CDNs / cross-
  // origin files ignore the download
  // attribute)
  //---------------------------------------

  async function handleDownload() {
    const name =
      (moment.title || "memory")
        .replace(/[^\w\d-]+/g, "-")
        .toLowerCase() + ".jpg";

    try {
      const response =
        await fetch(moment.image_url, {
          mode: "cors",
        });

      if (!response.ok) {
        throw new Error(
          "fetch failed"
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download = name;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      notify.success(
        "Photo downloaded",
        "Check your downloads folder."
      );
    } catch {
      // Fallback: open in a new tab so
      // the user can long-press / save.
      const link =
        document.createElement("a");

      link.href = moment.image_url;

      link.download = name;

      link.target = "_blank";

      link.rel = "noopener";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      notify.info(
        "Opened photo",
        "Long-press or right-click to save it."
      );
    }
  }

  //---------------------------------------
  // Share — native, then clipboard
  //---------------------------------------

  async function handleShare() {
    const shareData = {
      title: moment.title,
      text:
        moment.description ||
        moment.title,
      url: moment.image_url,
    };

    if (navigator.share) {
      try {
        await navigator.share(
          shareData
        );

        return;
      } catch (error) {
        // User cancelled — not an error.
        if (
          error?.name === "AbortError"
        ) {
          return;
        }
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(
        moment.image_url
      );

      notify.success(
        "Link copied!",
        "The photo link is on your clipboard."
      );
    } catch {
      notify.error(
        "Couldn't share",
        "Copy the link from your browser instead."
      );
    }
  }

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
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {/* Previous */}

        <button
          className={styles.prev}
          onClick={onPrev}
          aria-label="Previous memory"
        >
          <ChevronLeft
            size={32}
          />
        </button>

        {/* Image (swipeable) */}

        <motion.img
          key={moment.id}
          src={moment.image_url || "https://placehold.co/900x600?text=Memory"}
          alt={moment.title}
          className={styles.image}
          draggable={false}
          onTouchStart={
            handleTouchStart
          }
          onTouchEnd={
            handleTouchEnd
          }
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
          aria-label="Next memory"
        >
          <ChevronRight
            size={32}
          />
        </button>

        {/* Counter */}

        <div
          className={styles.counter}
        >
          {index + 1} /{" "}
          {moments.length}
        </div>

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
            </div>

            <p>
              {
                moment.description
              }
            </p>
          </div>

          <div
            className={
              styles.actions
            }
          >
            <button
              className={styles.actionButton}
              onClick={
                handleFavorite
              }
              aria-label={
                moment.is_favorite
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
            >
              <Heart
                size={18}
                fill={
                  moment.is_favorite
                    ? "currentColor"
                    : "none"
                }
              />

              <span>
                {moment.is_favorite
                  ? "Favorited"
                  : "Favorite"}
              </span>
            </button>

            <button
              className={styles.actionButton}
              onClick={
                handleDownload
              }
              aria-label="Download photo"
            >
              <Download
                size={18}
              />

              <span>
                Download
              </span>
            </button>

            <button
              className={styles.actionButton}
              onClick={
                handleShare
              }
              aria-label="Share photo"
            >
              <Share2
                size={18}
              />

              <span>
                Share
              </span>
            </button>

            {onOpenMoment && (
              <button
                className={`${styles.actionButton} ${styles.primaryAction}`}
                onClick={() =>
                  onOpenMoment(
                    moment.id
                  )
                }
              >
                <ArrowUpRight
                  size={18}
                />

                <span>
                  Open Memory
                </span>
              </button>
            )}

            <button
              className={styles.actionButton}
              onClick={() =>
                setPlaying(
                  !playing
                )
              }
              aria-label={
                playing
                  ? "Pause slideshow"
                  : "Play slideshow"
              }
            >
              {playing ? (
                <Pause
                  size={18}
                />
              ) : (
                <Play
                  size={18}
                />
              )}

              <span>
                {playing
                  ? "Pause"
                  : "Slideshow"}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GalleryLightbox;
