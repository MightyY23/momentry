import { motion } from "framer-motion";
import {
  BookOpen,
  Heart,
  Calendar,
  Sparkles,
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
          moments[0].memory_date
        ).getFullYear()
      : new Date().getFullYear();

  const chapters = Math.max(
    1,
    Math.ceil(moments.length / 5)
  );

  return (
    <motion.section
      className={styles.wrapper}
      initial={{
        opacity: 0,
        y: 40,
        scale: .96,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: .6,
      }}
    >
      <div className={styles.book}>
        <div className={styles.cornerTop} />
        <div className={styles.cornerBottom} />

        <div className={styles.spine} />

        <div className={styles.cover}>
          <div className={styles.badge}>
            <Sparkles size={15} />
            Momentry StoryBook
          </div>

          <BookOpen
            size={74}
            className={styles.bookIcon}
          />

          <h1>
            {story?.title ??
              "Our Story"}
          </h1>

          <p>
            Every memory deserves
            its own chapter.
          </p>

          <div className={styles.divider} />

          <div className={styles.stats}>
            <div>
              <Heart size={20} />
              <strong>
                {moments.length}
              </strong>
              <span>
                Memories
              </span>
            </div>

            <div>
              <Calendar size={20} />
              <strong>
                {firstYear}
              </strong>
              <span>
                Began
              </span>
            </div>

            <div>
              <BookOpen size={20} />
              <strong>
                {chapters}
              </strong>
              <span>
                Chapters
              </span>
            </div>
          </div>

          <Button
            size="lg"
            className={styles.button}
            onClick={onOpen}
          >
            📖 Open StoryBook
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

export default BookCover;