import {
  Maximize,
  Minimize,
  Type,
  BookOpen,
  List,
  Moon,
  Coffee,
} from "lucide-react";

import styles from "./ReadingToolbar.module.css";

function ReadingToolbar({
  fontSize,
  setFontSize,
  fullscreen,
  toggleFullscreen,
  theme,
  setTheme,
  onToggleToc,
}) {

  const themes = [
    {
      id: "paper",
      icon: <BookOpen size={18} />,
      label: "Paper",
    },
    {
      id: "sepia",
      icon: <Coffee size={18} />,
      label: "Sepia",
    },
    {
      id: "dark",
      icon: <Moon size={18} />,
      label: "Dark",
    },
  ];

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <button
          className={styles.button}
          onClick={() =>
            setFontSize((s) =>
              Math.max(18, s - 2)
            )
          }
          title="Decrease font"
          aria-label="Decrease font size"
        >
          A−
        </button>

        <div className={styles.font}>
          <Type size={18} />

          <span>{fontSize}px</span>
        </div>

        <button
          className={styles.button}
          onClick={() =>
            setFontSize((s) =>
              Math.min(36, s + 2)
            )
          }
          title="Increase font"
          aria-label="Increase font size"
        >
          A+
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        {themes.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              setTheme(item.id)
            }
            className={
              theme === item.id
                ? `${styles.button} ${styles.active}`
                : styles.button
            }
            title={item.label}
            aria-label={`${item.label} reading theme`}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      <button
        className={styles.button}
        onClick={onToggleToc}
        title="Table of contents"
        aria-label="Table of contents"
      >
        <List size={18} />
      </button>

      <div className={styles.divider} />

      <button
        className={styles.button}
        onClick={toggleFullscreen}
        title="Fullscreen"
        aria-label={
          fullscreen
            ? "Exit fullscreen"
            : "Enter fullscreen"
        }
      >
        {fullscreen ? (
          <Minimize size={18} />
        ) : (
          <Maximize size={18} />
        )}
      </button>
    </div>
  );
}

export default ReadingToolbar;