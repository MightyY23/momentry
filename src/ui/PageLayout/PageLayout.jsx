import styles from "./PageLayout.module.css";

function PageLayout({ children }) {
  return (
    <main className={styles.page}>
      <div className={styles.mesh}></div>

      <div className={`${styles.blob} ${styles.blobOne}`}></div>

      <div className={`${styles.blob} ${styles.blobTwo}`}></div>

      <div className={`${styles.blob} ${styles.blobThree}`}></div>

      <div className={styles.noise}></div>

      <div className={styles.content}>
        {children}
      </div>
    </main>
  );
}

export default PageLayout;