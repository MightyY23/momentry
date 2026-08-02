import styles from "./FormField.module.css";

function FormField({
  label,
  required = false,
  helperText,
  error,
  children,
}) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label}>
          {label}

          {required && (
            <span className={styles.required}>
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <p className={styles.error}>
          {error}
        </p>
      ) : helperText ? (
        <p className={styles.helper}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;