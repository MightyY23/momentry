import styles from "./Heading.module.css";

function Heading({ children, level = 1 }) {
  if (level === 1) {
    return <h1 className={styles.h1}>{children}</h1>;
  }

  if (level === 2) {
    return <h2 className={styles.h2}>{children}</h2>;
  }

  return <h3 className={styles.h3}>{children}</h3>;
}

export default Heading;