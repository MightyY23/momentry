import ThemeCard from "./ThemeCard";

import styles from "./Appearance.module.css";

import { useTheme } from "../../../../contexts/useTheme";
function Appearance() {
  const { theme, setTheme } =
    useTheme();

  const themes = [
    {
      id: "light",
      emoji: "☀️",
      title: "Light",
    },
    {
      id: "dark",
      emoji: "🌙",
      title: "Dark",
    },
    {
      id: "system",
      emoji: "💻",
      title: "System",
    },
  ];

  return (
    <div>
      <h3 className={styles.title}>
        Theme
      </h3>

      <div className={styles.grid}>
        {themes.map((item) => (
          <ThemeCard
            key={item.id}
            emoji={item.emoji}
            title={item.title}
            active={
              theme === item.id
            }
            onClick={() =>
              setTheme(item.id)
            }
          />
        ))}
      </div>
    </div>
  );
}

export default Appearance;