import {
  Maximize,
  Minimize,
  Type,
  BookOpen,
  Moon,
  Sun,
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
          onClick={() =>
            setFontSize((s) =>
              Math.max(18, s - 2)
            )
          }
          title="Decrease font"
        >
          A−
        </button>

        <div className={styles.font}>
          <Type size={18} />

          <span>{fontSize}px</span>
        </div>

        <button
          onClick={() =>
            setFontSize((s) =>
              Math.min(36, s + 2)
            )
          }
          title="Increase font"
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
                ? styles.active
                : ""
            }
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      <button
        onClick={toggleFullscreen}
        title="Fullscreen"
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