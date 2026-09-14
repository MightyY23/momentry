import { useCallback, useEffect, useRef, useState } from "react";

import BookPage from "./BookPage";
import ProgressBar from "./ProgressBar";
import TableOfContents from "./TableOfContents";
import ReadingToolbar from "./ReadingToolbar/ReadingToolbar";

import styles from "./BookReader.module.css";

const PAGE_KEY_BASE =
  "momentry_storybook_page";

const FONT_KEY =
  "momentry_storybook_font_size";

const THEME_KEY =
  "momentry_storybook_theme";

function BookReader({
  book,
  onClose,
}) {
  const storyKey = book?.storyId
    ? `${PAGE_KEY_BASE}_${book.storyId}`
    : PAGE_KEY_BASE;

  //---------------------------------------
  // States
  //---------------------------------------

  const [rawPage, setRawPage] = useState(() => {
    const saved = localStorage.getItem(
      storyKey
    );

    const parsed = saved
      ? Number(saved)
      : 0;

    const total =
      book?.chapters?.length ?? 0;

    return Number.isFinite(parsed) &&
      parsed >= 0 &&
      parsed < total
      ? parsed
      : 0;
  });

  const [fontSize, setFontSizeState] =
    useState(() => {
      const saved = localStorage.getItem(
        FONT_KEY
      );

      const parsed = saved
        ? Number(saved)
        : 24;

      return parsed >= 18 && parsed <= 36
        ? parsed
        : 24;
    });

  const [theme, setThemeState] =
    useState(() => {
      const saved = localStorage.getItem(
        THEME_KEY
      );

      return ["paper", "sepia", "dark"].includes(
        saved
      )
        ? saved
        : "paper";
    });

  const [fullscreen, setFullscreen] =
    useState(false);

  const [tocOpen, setTocOpen] =
    useState(false);

  const bookAreaRef = useRef(null);

  //---------------------------------------
  // Keep page valid when the book changes
  // (e.g. a new generation completes):
  // an out-of-range saved page simply
  // renders as page 0 — no cascading
  // setState needed.
  //---------------------------------------

  const totalChapters =
    book?.chapters?.length ?? 0;

  const page = rawPage < totalChapters
    ? rawPage
    : 0;

  //---------------------------------------
  // Persist page (per story), font, theme
  //---------------------------------------

  useEffect(() => {
    localStorage.setItem(
      storyKey,
      String(rawPage)
    );
  }, [storyKey, rawPage]);

  useEffect(() => {
    localStorage.setItem(
      FONT_KEY,
      String(fontSize)
    );
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(
      THEME_KEY,
      theme
    );
  }, [theme]);

  //---------------------------------------
  // Fullscreen
  //---------------------------------------

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch(console.error);
    } else {
      document
        .exitFullscreen()
        .catch(console.error);
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(
        !!document.fullscreenElement
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () =>
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
  }, []);

  //---------------------------------------
  // Keyboard navigation
  //---------------------------------------

  useEffect(() => {
    function handleKeyDown(e) {
      switch (e.key) {
        case "ArrowRight":
          setRawPage((prev) =>
            Math.min(
              prev + 1,
              book.chapters.length - 1
            )
          );
          break;

        case "ArrowLeft":
          setRawPage((prev) =>
            Math.max(prev - 1, 0)
          );
          break;

        case "Escape":
          if (tocOpen) {
            setTocOpen(false);
          } else if (
            document.fullscreenElement
          ) {
            document.exitFullscreen();
          } else {
            onClose?.();
          }
          break;

        default:
          break;
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    book.chapters.length,
    onClose,
    tocOpen,
  ]);

  //---------------------------------------
  // Mouse wheel navigation — scoped to
  // the book area so page scrolling and
  // the map/toolbar still work normally.
  //---------------------------------------

  const wheelLockRef = useRef(false);

  const handleWheel =
    useCallback(
      (e) => {
        if (wheelLockRef.current) {
          return;
        }

        if (Math.abs(e.deltaY) < 40) {
          return;
        }

        wheelLockRef.current = true;

        setTimeout(() => {
          wheelLockRef.current = false;
        }, 450);

        setRawPage((prev) => {
          if (e.deltaY > 0) {
            return Math.min(
              prev + 1,
              book.chapters.length - 1
            );
          }

          return Math.max(prev - 1, 0);
        });
      },
      [book.chapters.length]
    );

  useEffect(() => {
    const node =
      bookAreaRef.current;

    if (!node) return undefined;

    node.addEventListener(
      "wheel",
      handleWheel,
      { passive: true }
    );

    return () =>
      node.removeEventListener(
        "wheel",
        handleWheel
      );
  }, [handleWheel]);

  //---------------------------------------
  // Reading Progress
  //---------------------------------------

  const progress = Math.round(
    ((page + 1) /
      book.chapters.length) *
      100
  );

  //---------------------------------------
  // UI
  //---------------------------------------

  return (
    <>
      <ReadingToolbar
        fontSize={fontSize}
        setFontSize={setFontSizeState}
        theme={theme}
        setTheme={setThemeState}
        fullscreen={fullscreen}
        toggleFullscreen={
          toggleFullscreen
        }
        onToggleToc={() =>
          setTocOpen((v) => !v)
        }
      />

      {tocOpen && (
        <TableOfContents
          chapters={book.chapters}
          currentPage={page}
          onSelect={(index) => {
            setRawPage(index);

            setTocOpen(false);
          }}
        />
      )}

      <ProgressBar
        page={page + 1}
        total={book.chapters.length}
      />

      <div className={styles.reader}>
        {/* Left Stack */}

        <div className={styles.leftStack} />

        {/* Book */}

        <div
          ref={bookAreaRef}
          className={styles.bookArea}
        >
          <div
            className={styles.topBar}
          >
            <button
              className={
                styles.coverButton
              }
              onClick={onClose}
            >
              📕 Back to Cover
            </button>

            <div
              className={
                styles.progress
              }
            >
              {progress}% Read
            </div>
          </div>

          <BookPage
            chapter={
              book.chapters[page]
            }
            page={page}
            totalPages={
              book.chapters.length
            }
            fontSize={fontSize}
            theme={theme}
          />

          <div
            className={
              styles.navigation
            }
          >
            <button
              disabled={page === 0}
              onClick={() =>
                setRawPage((p) =>
                  Math.max(p - 1, 0)
                )
              }
            >
              ← Previous
            </button>

            <div
              className={
                styles.pageInfo
              }
            >
              <strong>
                {page + 1}
              </strong>

              <span>
                of{" "}
                {
                  book.chapters.length
                }
              </span>
            </div>

            <button
              disabled={
                page ===
                book.chapters.length - 1
              }
              onClick={() =>
                setRawPage((p) =>
                  Math.min(
                    p + 1,
                    book.chapters.length -
                      1
                  )
                )
              }
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right Stack */}

        <div
          className={styles.rightStack}
        />
      </div>
    </>
  );
}

export default BookReader;
