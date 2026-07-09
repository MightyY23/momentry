import styles from "./Button.module.css";

function Button({ children, onClick, type = "button" }) {
  return (
    <button
      className={styles.button}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export default Button;