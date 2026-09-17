import {
  BookMarked,
  Quote,
  Calendar,
  Clock3,
  MapPin,
  Heart,
} from "lucide-react";

import styles from "./BookPage.module.css";

function BookPage({
  chapter,
  page,
  totalPages,
  fontSize = 24,
  theme = "paper",
  immersive = false,
}) {
  const content = chapter?.content?.trim() || "";

  const words = content
    ? content.split(/\s+/).length
    : 0;

  const readingTime = Math.max(
    1,
    Math.ceil(words / 220)
  );

  const quoteText = content
    ? content
        .split(/[.!?]/)[0]
        .trim()
    : "";

  const quote = quoteText
    ? `${quoteText}.`
    : "Every memory deserves to be remembered.";

  const formattedDate =
    chapter?.memory_date
      ? new Date(
          chapter.memory_date
        ).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  // NOTE: the page flip is driven by the
  // CSS keyframe animation on the wrapper
  // div in BookReader (pageTurnNext/Prev) —
  // a framer-motion entrance here hung at
  // its initial state in the immersive
  // overlay (React 19 interop), leaving the
  // book invisible. A plain div renders
  // reliably and the CSS flip still plays.
  return (
    <div
      className={styles.pageWrapper}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className={
          immersive
            ? `${styles.book} ${styles[theme]} ${styles.bookImmersive}`
            : `${styles.book} ${styles[theme]}`
        }
        style={{
          "--font-size": `${fontSize}px`,
        }}
      >
        {/* ==================================================
            BOOKMARK
        ================================================== */}

        <div
          className={styles.bookmark}
          aria-hidden="true"
        />

        {/* ==================================================
            LEFT PAGE
        ================================================== */}

        <div className={styles.leftPage}>
          <div className={styles.chapterHeader}>
            <span className={styles.chapterLabel}>
              Chapter {page + 1}
            </span>

            <h2>
              {chapter?.title ||
                "Untitled Chapter"}
            </h2>

            {formattedDate && (
              <div
                className={
                  styles.chapterDate
                }
              >
                {formattedDate}
              </div>
            )}

            <div
              className={
                styles.decorative
              }
              aria-hidden="true"
            >
              ❦
            </div>
          </div>

          {/* Memory image */}

          {chapter?.image_url && (
            <img
              src={chapter.image_url}
              alt={
                chapter.title ||
                "Memory"
              }
              className={
                styles.heroImage
              }
            />
          )}

          {/* Reading information */}

          <div
            className={
              styles.readingMeta
            }
          >
            <div
              className={
                styles.readingBadge
              }
            >
              <Clock3 size={16} />

              <span>
                {readingTime} min read
              </span>
            </div>

            <div
              className={
                styles.readingTime
              }
            >
              {words} words
            </div>
          </div>

          {/* Story */}

          <p className={styles.story}>
            {content ||
              "This chapter is waiting for its story to be written."}
          </p>

          {/* Footer */}

          <div
            className={styles.footer}
          >
            <div
              className={
                styles.footerLeft
              }
            >
              <BookMarked size={18} />

              <span>
                Momentry StoryBook
              </span>
            </div>

            <div
              className={
                styles.footerRight
              }
            >
              Page {page * 2 + 1}
            </div>
          </div>

          {/* Page number */}

          <div
            className={
              styles.pageNumber
            }
          >
            {page * 2 + 1}
          </div>
        </div>

        {/* ==================================================
            SPINE
        ================================================== */}

        <div
          className={styles.spine}
          aria-hidden="true"
        />

        {/* ==================================================
            RIGHT PAGE
        ================================================== */}

        <div className={styles.rightPage}>
          <div
            className={
              styles.quoteCard
            }
          >
            <Quote size={34} />

            <p>{quote}</p>

            <div
              className={
                styles.quoteMeta
              }
            >
              {formattedDate && (
                <span>
                  <Calendar size={16} />

                  {formattedDate}
                </span>
              )}

              {chapter?.location && (
                <span>
                  <MapPin size={16} />

                  {chapter.location}
                </span>
              )}

              {chapter?.is_favorite && (
                <span>
                  <Heart
                    size={16}
                    fill="currentColor"
                  />

                  Favorite Memory
                </span>
              )}
            </div>
          </div>

          {/* Chapter information */}

          <div
            className={
              styles.totalPages
            }
          >
            Chapter {page + 1}
            <br />
            of {totalPages}
          </div>

          {/* Page number */}

          <div
            className={
              styles.pageNumber
            }
          >
            {page * 2 + 2}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookPage;