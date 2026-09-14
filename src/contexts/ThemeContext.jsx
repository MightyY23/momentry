import { useEffect, useState } from "react";

import { ThemeContext } from "./ThemeContextCore";

export function ThemeProvider({
  children,
}) {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ||
      "system"
  );

  useEffect(() => {
    localStorage.setItem(
      "theme",
      theme
    );

    const root =
      document.documentElement;

    root.classList.remove(
      "light",
      "dark"
    );

    if (theme === "system") {
      const prefersDark =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      root.classList.add(
        prefersDark
          ? "dark"
          : "light"
      );
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
