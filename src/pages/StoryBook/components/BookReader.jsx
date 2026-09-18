import { useEffect, useRef, useState } from "react";

import { X } from "lucide-react";

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
  autoFullscreen = false,
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

      if (
        ["paper", "sepia", "dark"].includes(
          saved
        )
      ) {
        return saved;
      }

      // First visit: follow the app theme.
      // (Explicit choices are kept.)
      const appIsDark =
        document.documentElement.classList.contains(
          "dark"
        );

      return appIsDark ? "dark" : "paper";
    });

  // Follow live app-theme switches while
  // the reader is open (only until the
  // user picks a book theme manually —
  // after that their choice persists).
  const themeChosenRef = useRef(
    Boolean(
      localStorage.getItem(THEME_KEY)
    )
  );

  useEffect(() => {
    if (themeChosenRef.current) {
      return undefined;
    }

    const observer =
      new MutationObserver(() => {
        const isDark =
          document.documentElement.classList.contains(
            "dark"
          );

        setThemeState(isDark ? "dark" : "paper");
      });

    observer.observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: ["class"],
      }
    );

    return () => observer.disconnect();
  }, []);

  const [fullscreen, setFullscreen] =
    useState(false);

  // Immersive overlay: covers the whole app
  // even where the native Fullscreen API is
  // unavailable (e.g. iPhone Safari).
  const [immersive, setImmersive] =
    useState(false);

  // Touch swipe page-turning.
  const touchStartX = useRef(null);

  // Direction of the last page turn —
  // drives the flip animation.
  const [turnDir, setTurnDir] =
    useState("next");

  // Portrait-phone hint when the OS
  // refuses landscape lock.
    //---------------------------------------
  // Page turning with animation direction
  //---------------------------------------

  function turnTo(delta) {
    setTurnDir(delta > 0 ? "next" : "prev");

    setRawPage((p) =>
      Math.min(
        Math.max(p + delta, 0),
        book.chapters.length - 1
      )
    );
  }

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
    /* Persist only explicit choices —
       synced themes keep following the
       app until the user picks one. */
    if (themeChosenRef.current) {
      localStorage.setItem(
        THEME_KEY,
        theme
      );
    }
  }, [theme]);

  function chooseTheme(next) {
    themeChosenRef.current = true;

    setThemeState(next);
  }

  //---------------------------------------
  // Reading streak — one tick per day, kept
  // in localStorage: { count, last }.
  //---------------------------------------

  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const KEY = "momentry_reading_streak";

    // Resolve outside the synchronous effect
    // body (lint: cascading renders).
    Promise.resolve().then(() => {
      try {
      const today = new Date().toDateString();

      const prev = JSON.parse(
        localStorage.getItem(KEY) || "{}"
      );

      if (prev.last === today) {
        setStreak(prev.count || 1);

        return;
      }

      const yesterday = new Date(
        Date.now() - 86400000
      ).toDateString();

      const next = {
        count: prev.last === yesterday ? (prev.count || 0) + 1 : 1,

        last: today,
      };

      localStorage.setItem(KEY, JSON.stringify(next));

      setStreak(next.count);
      } catch {
        /* private mode etc. — streak is cosmetic */
      }
    });
  }, []);

  //---------------------------------------
  // Fullscreen
  //---------------------------------------

  function toggleFullscreen() {
    const entering = !fullscreen;

    // Always enter the immersive overlay —
    // native fullscreen is a bonus where
    // the browser supports it.
    setImmersive(entering);

    document.body.style.overflow =
      entering ? "hidden" : "";

    if (entering) {
      document.documentElement
        .requestFullscreen?.()
        .catch(() => {});

      // Portrait stays portrait: the reader is
      // now a single-page portrait layout, so
      // never lock or suggest landscape.
    } else {
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* noop */
      }

      if (document.fullscreenElement) {
        document
          .exitFullscreen()
          .catch(() => {});
      }
    }

    setFullscreen(entering);
  }

  //---------------------------------------
  // Enter fullscreen straight away when
  // the reader is opened from the cover
  // (the click itself is the user gesture
  // browsers want for native fullscreen).
  //---------------------------------------

  const autoFullscreenRef = useRef(false);

  useEffect(() => {
    if (autoFullscreen && !autoFullscreenRef.current) {
      autoFullscreenRef.current = true;

      toggleFullscreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native exit (Esc / browser UI) must
  // also leave the immersive overlay.
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setImmersive(false);

        setFullscreen(false);

        document.body.style.overflow = "";
      }
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

  // Safety: release the scroll lock if the
  // reader unmounts while immersive.
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  //---------------------------------------
  // Keyboard navigation
  //---------------------------------------

  useEffect(() => {
    function handleKeyDown(e) {
      switch (e.key) {
        case "ArrowRight":
          turnTo(1);
          break;

        case "ArrowLeft":
          turnTo(-1);
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
  // Touch swipe page-turning (buttons,
  // taps, keyboard all still work).
  //---------------------------------------

  function handleTouchStart(e) {
    touchStartX.current =
      e.touches?.[0]?.clientX ?? null;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current == null) {
      return;
    }

    const endX =
      e.changedTouches?.[0]?.clientX;

    if (endX == null) {
      return;
    }

    const dx = endX - touchStartX.current;

    touchStartX.current = null;

    if (Math.abs(dx) < 60) return;

    turnTo(dx < 0 ? 1 : -1);
  }

  //---------------------------------------
  // Reading Progress
  //---------------------------------------

  const progress = Math.round(
    ((page + 1) /
      book.chapters.length) *
      100
  );

  const bookNode = (
    <div className={styles.readerWrap}>
      <div
        className={
          fullscreen || immersive
            ? `${styles.reader} ${styles.readerImmersive}`
            : styles.reader
        }
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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

          <div
            key={page}
            className={
              turnDir === "next"
                ? styles.pageTurnNext
                : styles.pageTurnPrev
            }
          >
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
              immersive={
                fullscreen || immersive
              }
            />
          </div>

          <div
            className={
              styles.navigation
            }
          >
            <button
              disabled={page === 0}
              onClick={() => turnTo(-1)}
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
              onClick={() => turnTo(1)}
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
    </div>
  );

  //---------------------------------------
  // UI: immersive overlay wraps the whole
  // book when fullscreen is active; on
  // iOS (no Fullscreen API) this still
  // delivers a distraction-free reader.
  //---------------------------------------

  if (immersive) {
    return (
      // immersiveOverlayHost (literal class)
      // lets ReadingToolbar.module.css switch
      // its sticky toolbar to normal flow inside
      // this non-scrolling overlay.
      <div
        className={[
          styles.immersiveOverlay,
          styles[`immersiveOverlay${theme.charAt(0).toUpperCase()}${theme.slice(1)}`],
          "immersiveOverlayHost",
        ].join(" ")}
      >
        <button
          className={styles.exitButton}
          onClick={toggleFullscreen}
          title="Exit fullscreen"
          aria-label="Exit fullscreen"
        >
          <X size={18} />
        </button>

        <ReadingToolbar
          fontSize={fontSize}
          setFontSize={setFontSizeState}
          theme={theme}
          setTheme={chooseTheme}
          fullscreen={fullscreen}
          toggleFullscreen={
            toggleFullscreen
          }
          onToggleToc={() =>
            setTocOpen((v) => !v)
          }
          compact={true}
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

        {streak > 1 && (
          <div className={styles.streakBadge} role="status">
            🔥 {streak}-day reading streak
          </div>
        )}

        <ProgressBar
          page={page + 1}
          total={book.chapters.length}
          compact={true}
        />

        {bookNode}
      </div>
    );
  }

  return (
    <>
      <ReadingToolbar
        fontSize={fontSize}
        setFontSize={setFontSizeState}
        theme={theme}
        setTheme={chooseTheme}
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

      {bookNode}
    </>
  );
}

export default BookReader;
