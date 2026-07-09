import styles from "./PageLayout.module.css";

function PageLayout({ children }) {
  return (
    <main className={styles.page}>
      {children}
    </main>
  );
}

export default PageLayout;