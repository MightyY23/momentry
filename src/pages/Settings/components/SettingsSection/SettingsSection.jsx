import styles from "./SettingsSection.module.css";

function SettingsSection({
  title,
  icon,
  children,
}) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.icon}>
          {icon}
        </span>

        <h2>{title}</h2>
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </section>
  );
}

export default SettingsSection;