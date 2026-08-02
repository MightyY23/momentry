import styles from "./Badge.module.css";

function Badge({
  children,
  variant = "primary",
  size = "md",
  icon,
  rounded = true,
  className = "",
}) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    rounded ? styles.rounded : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {icon && (
        <span className={styles.icon}>
          {icon}
        </span>
      )}

      <span>{children}</span>
    </span>
  );
}

export default Badge;