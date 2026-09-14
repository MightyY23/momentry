import styles from "./Loader.module.css";

/**
 * Centered animated spinner used for
 * Suspense fallbacks and page loading.
 */
function Loader({ label = "Loading…" }) {
  return (
    <div
      className={styles.wrapper}
      role="status"
      aria-live="polite"
    >
      <div className={styles.spinner} />

      <span className={styles.label}>
        {label}
      </span>
    </div>
  );
}

export default Loader;
