import { motion } from "framer-motion";
import styles from "./Button.module.css";

function Button({
  children,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  className = "",
  ...props
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    loading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled || loading}
      whileTap={
    disabled || loading
        ? {}
        : { scale: 0.98 }
      }
      transition={{
        duration: 0.2,
      }}
      {...props}
    >
      {loading && (
        <span className={styles.spinner} />
      )}

      {!loading && leftIcon && (
        <span className={styles.icon}>
          {leftIcon}
        </span>
      )}

      <span className={styles.label}>
        {children}
      </span>

      {!loading && rightIcon && (
        <span className={styles.icon}>
          {rightIcon}
        </span>
      )}
    </motion.button>
  );
}

export default Button;