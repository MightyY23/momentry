import { motion } from "framer-motion";
import {
  BookOpen,
  Heart,
  Calendar,
  Sparkles,
  MapPin,
} from "lucide-react";

import Button from "../../../ui/Button/Button";

import styles from "./BookCover.module.css";

function BookCover({
  story,
  moments = [],
  onOpen,
}) {
  const firstYear =
    moments.length > 0
      ? new Date(
          [...moments].sort(
            (a, b) =>
              new Date(a.memory_date) -
              new Date(b.memory_date)
          )[0].memory_date
        ).getFullYear()
      : new Date().getFullYear();

  const chapters = Math.max(
    1,
    Math.ceil(moments.length / 5)
  );

  const places = new Set(
    moments
      .filter((m) => m.location)
      .map((m) => m.location)
  ).size;

  // Story settings cover wins; fall back
  // to the first memory photo.
  const coverImage =
    story?.cover_photo ||
    moments.find((m) => m.image_url)
      ?.image_url;

  return (
    <motion.section
      className={styles.wrapper}
      initial={{
        opacity: 0,
        y: 40,
        scale: 0.96,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.65,
      }}
    >
      {/* Floating particles */}

      <div className={styles.particles}>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Book */}

      <motion.div
        className={styles.book}
        whileHover={{
          rotateY: -3,
          rotateX: 2,
          y: -8,
        }}
        transition={{
          duration: 0.35,
        }}
      >
        <div className={styles.spine} />

        <div className={styles.cover}>
          <div
            className={styles.cornerTop}
          />

          <div
            className={
              styles.cornerBottom
            }
          />

          <div className={styles.badge}>
            <Sparkles size={15} />

            Momentry StoryBook
          </div>

          {coverImage ? (
            <div
              className={
                styles.coverPhoto
              }
            >
              <img
                src={coverImage}
                alt="Cover"
              />
            </div>
          ) : (
            <BookOpen
              size={82}
              className={
                styles.bookIcon
              }
            />
          )}

          <h1>
            {story?.title ||
              "Our Story"}
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Every memory tells a
            story. Every story
            deserves to live
            forever.
          </p>

          <div
            className={
              styles.divider
            }
          />

          <div
            className={
              styles.stats
            }
          >
            <div>
              <Heart size={22} />

              <strong>
                {moments.length}
              </strong>

              <span>
                Memories
              </span>
            </div>

            <div>
              <Calendar
                size={22}
              />

              <strong>
                {firstYear}
              </strong>

              <span>
                Since
              </span>
            </div>

            <div>
              <BookOpen
                size={22}
              />

              <strong>
                {chapters}
              </strong>

              <span>
                Chapters
              </span>
            </div>

            <div>
              <MapPin
                size={22}
              />

              <strong>
                {places}
              </strong>

              <span>
                Places
              </span>
            </div>
          </div>

          <blockquote
            className={styles.quote}
          >
            “Some stories deserve
            more than memories.
            They deserve a place
            to live forever.”
          </blockquote>

          <Button
            size="lg"
            className={styles.button}
            onClick={onOpen}
            leftIcon="📖"
          >
            Open StoryBook
          </Button>

          <p
            className={
              styles.footer
            }
          >
            ❤️ A lifetime of
            beautiful memories
          </p>
        </div>
      </motion.div>
    </motion.section>
  );
}

export default BookCover;