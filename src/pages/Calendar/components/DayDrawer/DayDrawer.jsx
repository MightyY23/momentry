import { AnimatePresence, motion } from "framer-motion";

import DayMemoryCard from "../DayMemoryCard/DayMemoryCard";

import styles from "./DayDrawer.module.css";

function DayDrawer({
  open,
  onClose,
  selectedDate,
  moments,
}) {
  //---------------------------------------
  // No Date Selected
  //---------------------------------------

  if (!selectedDate) return null;

  //---------------------------------------
  // Memories
  //---------------------------------------

  const filtered = moments.filter(
    (moment) => {
      if (!moment.memory_date)
        return false;

      const date = new Date(
        moment.memory_date
      );

      return (
        date.getDate() ===
          selectedDate.getDate() &&
        date.getMonth() ===
          selectedDate.getMonth() &&
        date.getFullYear() ===
          selectedDate.getFullYear()
      );
    }
  );

  //---------------------------------------

  const formattedDate =
    selectedDate.toLocaleDateString(
      "default",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  //---------------------------------------

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.25,
            }}
          />

          <motion.aside
            className={styles.drawer}
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 28,
            }}
            aria-label="Memory details"
          >
            <header className={styles.header}>
              <div>
                <span className={styles.label}>
                  Memory Journal
                </span>

                <h2>{formattedDate}</h2>

                <p>
                  {filtered.length}{" "}
                  {filtered.length === 1
                    ? "memory"
                    : "memories"}
                </p>
              </div>

              <button
                onClick={onClose}
                className={styles.close}
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            <div className={styles.content}>
              {filtered.length ===
              0 ? (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  <div
                    className={
                      styles.emptyIcon
                    }
                  >
                    📅
                  </div>

                  <h3>
                    No memories yet
                  </h3>

                  <p>
                    Nothing was saved
                    for this day.
                  </p>
                </div>
              ) : (
                filtered.map(
                  (moment) => (
                    <DayMemoryCard
                      key={moment.id}
                      moment={moment}
                    />
                  )
                )
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default DayDrawer;