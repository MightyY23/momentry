import styles from "./AnimatedBackground.module.css";

function AnimatedBackground() {
  return (
    <div className={styles.background}>
      <div className={styles.blur1}></div>
      <div className={styles.blur2}></div>
      <div className={styles.blur3}></div>
    </div>
  );
}

export default AnimatedBackground;