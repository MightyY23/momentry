import { motion } from "framer-motion";
import styles from "./Section.module.css";

function Section({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`${styles.section} ${className}`}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.titleGroup}>
          {icon && (
            <div className={styles.icon}>
              {icon}
            </div>
          )}

          <div>
            <h2>{title}</h2>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>
        </div>

        {action && (
          <div className={styles.action}>
            {action}
          </div>
        )}
      </motion.div>

      <div className={styles.content}>
        {children}
      </div>
    </section>
  );
}

export default Section;