import styles from "./Input.module.css";

function Input({
  leftIcon,
  rightIcon,
  className = "",
  ...props
}) {
  return (
    <div
      className={`${styles.wrapper} ${className}`}
    >
      {leftIcon && (
        <span className={styles.icon}>
          {leftIcon}
        </span>
      )}

      <input
        className={styles.input}
        {...props}
      />

      {rightIcon && (
        <span className={styles.icon}>
          {rightIcon}
        </span>
      )}
    </div>
  );
}

export default Input;