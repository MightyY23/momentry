import styles from "./Chip.module.css";

function Chip({
  children,
  icon,
  variant = "default",
  size = "md",
  clickable = false,
  className = "",
  ...props
}) {
  const classes = [
    styles.chip,
    styles[variant],
    styles[size],
    clickable ? styles.clickable : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      {...props}
    >
      {icon && (
        <span className={styles.icon}>
          {icon}
        </span>
      )}

      <span className={styles.text}>
        {children}
      </span>
    </span>
  );
}

export default Chip;