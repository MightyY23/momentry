import styles from "./Text.module.css";

function Text({ children, secondary = false }) {
  return (
    <p className={secondary ? styles.secondary : styles.primary}>
      {children}
    </p>
  );
}

export default Text;