import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import styles from "./Drawer.module.css";

function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
  width = "420px",
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className={styles.drawer}
            style={{
              width,
              [side]: 0,
            }}
            initial={{
              x: side === "right" ? width : `-${width}`,
            }}
            animate={{ x: 0 }}
            exit={{
              x: side === "right" ? width : `-${width}`,
            }}
          >
            <header className={styles.header}>
              <h2>{title}</h2>

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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default Drawer;