import styles from "./Welcome.module.css";

function Welcome() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.logo}>Momentry</h1>

        <p className={styles.tagline}>
          Because Every Love Story
          <br />
          Deserves a Home.
        </p>

        <button className={styles.button}>
          Begin Your Story
        </button>
      </div>
    </main>
  );
}

export default Welcome;