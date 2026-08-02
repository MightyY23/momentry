import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked,
  Quote,
} from "lucide-react";

import styles from "./BookPage.module.css";

function BookPage({
  chapter,
  page,
  totalPages,
  fontSize = 24,
  theme = "paper",
}) {

  const words =
    chapter.content
      ?.trim()
      .split(/\s+/).length || 0;

  const readingTime =
    Math.max(
      1,
      Math.ceil(words / 220)
    );

  const quote =
    chapter.content
      ?.split(".")[0]
      ?.trim() + ".";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        className={styles.wrapper}
        initial={{
          rotateY:
            page % 2 === 0
              ? -90
              : 90,
          opacity: 0,
          scale: .97,
        }}
        animate={{
          rotateY: 0,
          opacity: 1,
          scale: 1,
        }}
        exit={{
          rotateY:
            page % 2 === 0
              ? 90
              : -90,
          opacity: 0,
          scale: .97,
        }}
        transition={{
          duration: .75,
          ease: "easeInOut",
        }}
        style={{
          transformStyle:
            "preserve-3d",
          transformOrigin:
            page % 2 === 0
              ? "left center"
              : "right center",
        }}
      >
        <div
          className={`${styles.book} ${styles[theme]}`}
          style={{
            "--font-size": `${fontSize}px`,
          }}
        >
          {/* LEFT PAGE */}

          <div
            className={
              styles.leftPage
            }
          >
            <div
              className={
                styles.pageNumber
              }
            >
              {page * 2 + 1}
            </div>

            <span
              className={
                styles.chapterLabel
              }
            >
              Chapter {page + 1}
            </span>

            <h2>
              {chapter.title}
            </h2>

            <div
              className={
                styles.divider
              }
            />

            <p
              className={
                styles.story
              }
            >
              {chapter.content}
            </p>

            <div
              className={
                styles.footer
              }
            >
              <BookMarked
                size={18}
              />

              {words} words ·{" "}
              {readingTime} min read
            </div>
          </div>

          {/* SPINE */}

          <div
            className={
              styles.spine
            }
          />

          {/* RIGHT PAGE */}

          <div
            className={
              styles.rightPage
            }
          >
            <div
              className={
                styles.quoteCard
              }
            >
              <Quote
                size={30}
              />

              <p>
                {quote}
              </p>
            </div>

            <div
              className={
                styles.pageNumber
              }
            >
              {page * 2 + 2}
            </div>

            <div
              className={
                styles.totalPages
              }
            >
              Chapter{" "}
              {page + 1}
              <br />
              of{" "}
              {totalPages}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BookPage;