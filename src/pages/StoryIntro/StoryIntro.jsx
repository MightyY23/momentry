import { useNavigate } from "react-router-dom";

import styles from "./StoryIntro.module.css";

function StoryIntro() {
  const navigate = useNavigate();

  return (
    <div className={styles.scene}>
      <div className={styles.orbA} aria-hidden="true" />
      <div className={styles.orbB} aria-hidden="true" />

      <main className={styles.stage}>
        {/* Floating polaroid cards */}
        <div
          className={styles.cards}
          aria-hidden="true"
        >
          <div className={`${styles.card} ${styles.cardA}`}>
            <div
              className={`${styles.photo} ${styles.photoRose}`}
            >
              ♥
            </div>
            <p className={styles.caption}>
              the first text
            </p>
          </div>

          <div className={`${styles.card} ${styles.cardB}`}>
            <div
              className={`${styles.photo} ${styles.photoGold}`}
            >
              ☀
            </div>
            <p className={styles.caption}>
              the first laugh
            </p>
          </div>

          <div className={`${styles.card} ${styles.cardC}`}>
            <div
              className={`${styles.photo} ${styles.photoSky}`}
            >
              ✦
            </div>
            <p className={styles.caption}>
              the first photo
            </p>
          </div>
        </div>

        <div className={styles.copy}>
          <p className={styles.kicker}>
            Chapter two
          </p>

          <h1 className={styles.title}>
            A single moment
            <br />
            is where it
            <br />
            <em>begins.</em>
          </h1>

          <p className={styles.body}>
            The little memories that quietly become
            your favorite ones. Momentry gives those
            moments a home — and turns them into a
            story you can hold.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cta}
              onClick={() => navigate("/auth")}
            >
              Continue
              <span
                className={styles.ctaArrow}
                aria-hidden="true"
              >
                →
              </span>
            </button>

            <button
              type="button"
              className={styles.back}
              onClick={() => navigate("/")}
            >
              ← Back
            </button>
          </div>
        </div>
      </main>

      <footer
        className={styles.chapterNav}
        aria-label="Introductory chapters"
      >
        <button
          type="button"
          className={styles.dot}
          aria-label="Chapter one"
          onClick={() => navigate("/")}
        />
        <span
          className={`${styles.dot} ${styles.dotActive}`}
        />
      </footer>
    </div>
  );
}

export default StoryIntro;
