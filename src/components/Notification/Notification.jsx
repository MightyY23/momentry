import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import styles from "./Notification.module.css";

const icons = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  achievement: "🏆",
};

function Notification({
  notification,
  onClose,
}) {
  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      onClose();
    }, notification.duration || 4000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          className={`${styles.toast} ${
            styles[notification.type] || ""
          }`}
          initial={{
            opacity: 0,
            y: -40,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -40,
            scale: 0.95,
          }}
          transition={{
            duration: 0.35,
          }}
        >
          <div className={styles.icon}>
            {icons[notification.type] ||
              "🔔"}
          </div>

          <div className={styles.content}>
            <h4>
              {notification.title}
            </h4>

            <p>
              {notification.message}
            </p>
          </div>

          <button
            className={styles.close}
            onClick={onClose}
          >
            ✕
          </button>

          <motion.div
            className={styles.progress}
            initial={{
              width: "100%",
            }}
            animate={{
              width: "0%",
            }}
            transition={{
              duration:
                (notification.duration ||
                  4000) / 1000,
              ease: "linear",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Notification;