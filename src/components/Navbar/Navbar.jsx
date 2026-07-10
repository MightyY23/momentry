import { NavLink } from "react-router-dom";

import styles from "./Navbar.module.css";

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <h2 className={styles.logo}>
        ❤️ Momentry
      </h2>

      <div className={styles.links}>
        <NavLink
          to="/home"
          className={({ isActive }) =>
            isActive
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
        >
          🏠 Home
        </NavLink>

        <NavLink
          to="/gallery"
          className={({ isActive }) =>
            isActive
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
        >
          📸 Gallery
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
        >
          👤 Profile
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;