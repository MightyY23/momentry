import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import styles from "./Modal.module.css";

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  elevated = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={`${styles.backdrop}${elevated ? ` ${styles.backdropElevated}` : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`${styles.modal} ${styles[size]}${elevated ? ` ${styles.elevated}` : ""}`}
            initial={{
              opacity: 0,
              scale: .94,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: .94,
              y: 20,
            }}
            transition={{
              duration: .25,
            }}
          >
            <header className={styles.header}>
              <div>
                <h2>{title}</h2>

                {subtitle && (
                  <p>{subtitle}</p>
                )}
              </div>

              <button
                onClick={onClose}
                className={styles.close}
              >
                <X size={20} />
              </button>
            </header>

            <div className={styles.body}>
              {children}
            </div>

            {footer && (
              <footer className={styles.footer}>
                {footer}
              </footer>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Modal;