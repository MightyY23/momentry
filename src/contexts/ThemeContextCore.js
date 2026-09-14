import { createContext } from "react";

/**
 * Context lives in its own module so the
 * provider file only exports components
 * (react-refresh requirement).
 */
export const ThemeContext = createContext();
