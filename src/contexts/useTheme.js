import { useContext } from "react";

import { ThemeContext } from "./ThemeContextCore";

export function useTheme() {
  return useContext(ThemeContext);
}
