import { useNavigate } from "react-router-dom";

import styles from "./Welcome.module.css";

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className={styles.scene}>
      {/* Ambient glow orbs (pure CSS, theme-aware) */}
      <div className={styles.orbA} aria-hidden="true" />
      <div className={styles.orbB} aria-hidden="true" />
      <div className={styles.orbC} aria-hidden="true" />

      {/* Soft vignette for depth */}
      <div className={styles.vignette} aria-hidden="true" />

      <main className={styles.stage}>
        <p className={styles.kicker}>
          Chapter one
        </p>

        <h1 className={styles.title}>
          Every love story
          <br />
          <em>deserves a home.</em>
        </h1>

        <p className={styles.tagline}>
          Momentry gathers the first texts, the first
          laughs and the first photographs into one
          living story — yours.
        </p>

        <button
          type="button"
          className={styles.cta}
          onClick={() => navigate("/story-introduction")}
        >
          Begin Your Story
          <span
            className={styles.ctaArrow}
            aria-hidden="true"
          >
            →
          </span>
        </button>
      </main>

      <footer
        className={styles.chapterNav}
        aria-label="Introductory chapters"
      >
        <span
          className={`${styles.dot} ${styles.dotActive}`}
        />
        <span className={styles.dot} />
      </footer>
    </div>
  );
}

export default Welcome;
