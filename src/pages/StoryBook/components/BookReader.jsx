import { useEffect, useState } from "react";

import BookPage from "./BookPage";
import ProgressBar from "./ProgressBar";
import TableOfContents from "./TableOfContents";
import ReadingToolbar from "./ReadingToolbar/ReadingToolbar";

import styles from "./BookReader.module.css";

const STORAGE_KEY = "momentry_storybook_page";

function BookReader({ book, onClose }) {
  //---------------------------------------
  // States
  //---------------------------------------

  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 0;
  });

  const [fontSize, setFontSize] = useState(24);
  const [theme, setTheme] = useState("paper");
  const [fullscreen, setFullscreen] = useState(false);

  //---------------------------------------
  // Keep page valid
  //---------------------------------------

  useEffect(() => {
    if (!book?.chapters?.length) return;

    if (page > book.chapters.length - 1) {
      setPage(0);
    }
  }, [book, page]);

  //---------------------------------------
  // Save page
  //---------------------------------------

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, page);
  }, [page]);

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
      setFullscreen(!!document.fullscreenElement);
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
          setPage((prev) =>
            Math.min(
              prev + 1,
              book.chapters.length - 1
            )
          );
          break;

        case "ArrowLeft":
          setPage((prev) =>
            Math.max(prev - 1, 0)
          );
          break;

        case "Escape":
          if (document.fullscreenElement) {
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
  }, [book.chapters.length, onClose]);

  //---------------------------------------
  // Mouse wheel navigation
  //---------------------------------------

  useEffect(() => {
    let timeout = null;

    function handleWheel(e) {
      if (timeout) return;

      timeout = setTimeout(() => {
        timeout = null;
      }, 450);

      if (e.deltaY > 40) {
        setPage((prev) =>
          Math.min(
            prev + 1,
            book.chapters.length - 1
          )
        );
      }

      if (e.deltaY < -40) {
        setPage((prev) =>
          Math.max(prev - 1, 0)
        );
      }
    }

    window.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: true,
      }
    );

    return () =>
      window.removeEventListener(
        "wheel",
        handleWheel
      );
  }, [book.chapters.length]);

  //---------------------------------------
  // Reading Progress
  //---------------------------------------

  const progress = Math.round(
    ((page + 1) / book.chapters.length) * 100
  );

  //---------------------------------------
  // UI
  //---------------------------------------

  return (
    <>
      <TableOfContents
        chapters={book.chapters}
        currentPage={page}
        onSelect={setPage}
      />

      <ReadingToolbar
        fontSize={fontSize}
        setFontSize={setFontSize}
        theme={theme}
        setTheme={setTheme}
        fullscreen={fullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      <ProgressBar
        page={page + 1}
        total={book.chapters.length}
      />

      <div className={styles.topBar}>
        <button
          className={styles.coverButton}
          onClick={onClose}
        >
          📕 Back to Cover
        </button>

        <div className={styles.progress}>
          {progress}% Read
        </div>
      </div>

      <BookPage
        chapter={book.chapters[page]}
        page={page}
        totalPages={book.chapters.length}
        fontSize={fontSize}
        theme={theme}
      />

      <div className={styles.navigation}>
        <button
          disabled={page === 0}
          onClick={() =>
            setPage((prev) =>
              Math.max(prev - 1, 0)
            )
          }
        >
          ← Previous
        </button>

        <div className={styles.pageInfo}>
          Page {page + 1} of {book.chapters.length}
        </div>

        <button
          disabled={
            page ===
            book.chapters.length - 1
          }
          onClick={() =>
            setPage((prev) =>
              Math.min(
                prev + 1,
                book.chapters.length - 1
              )
            )
          }
        >
          Next →
        </button>
      </div>
    </>
  );
}

export default BookReader;