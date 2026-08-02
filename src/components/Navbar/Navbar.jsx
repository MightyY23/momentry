import { useState } from "react";
import { NavLink } from "react-router-dom";

import {
  Heart,
  Home,
  Images,
  BookHeart,
  MapPinned,
  CalendarDays,
  ChartColumn,
  Search,
  UserRound,
  Settings,
  Menu,
  X,
} from "lucide-react";

import styles from "./Navbar.module.css";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    {
      path: "/home",
      icon: Home,
      label: "Home",
    },
    {
      path: "/gallery",
      icon: Images,
      label: "Gallery",
    },
    {
      path: "/storybook",
      icon: BookHeart,
      label: "StoryBook",
    },
    {
      path: "/memory-map",
      icon: MapPinned,
      label: "Map",
    },
    {
      path: "/calendar",
      icon: CalendarDays,
      label: "Calendar",
    },
    {
      path: "/analytics",
      icon: ChartColumn,
      label: "Analytics",
    },
    {
      path: "/search",
      icon: Search,
      label: "Search",
    },
    {
      path: "/profile",
      icon: UserRound,
      label: "Profile",
    },
    {
      path: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <header className={styles.wrapper}>
      <nav className={styles.navbar}>
        {/* Brand */}

        <div className={styles.brand}>
          <div className={styles.logoCircle}>
            <Heart
              size={22}
              fill="currentColor"
            />
          </div>

          <div className={styles.brandText}>
            <h1>Momentry</h1>

            <span>
              Every Moment Matters
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}

        <div className={styles.desktopLinks}>
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  isActive
                    ? `${styles.link} ${styles.active}`
                    : styles.link
                }
              >
                <Icon size={18} />

                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Mobile Button */}

        <button
          className={styles.menuButton}
          onClick={() =>
            setMobileOpen(!mobileOpen)
          }
          aria-label="Toggle navigation"
        >
          {mobileOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </nav>

      {/* Mobile Navigation */}

      <div
        className={`${styles.mobileMenu} ${
          mobileOpen
            ? styles.mobileOpen
            : ""
        }`}
      >
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() =>
                setMobileOpen(false)
              }
              className={({ isActive }) =>
                isActive
                  ? `${styles.mobileLink} ${styles.active}`
                  : styles.mobileLink
              }
            >
              <Icon size={18} />

              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </header>
  );
}

export default Navbar;