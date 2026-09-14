import { motion } from "framer-motion";
import { X } from "lucide-react";

import styles from "./TableOfContents.module.css";

function TableOfContents({
  chapters,
  currentPage,
  onSelect,
  onClose,
}) {
  return (
    <motion.div
      className={styles.container}
      initial={{
        opacity: 0,
        y: -12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -12,
      }}
      transition={{
        duration: 0.22,
      }}
    >
      <div className={styles.header}>
        <h2>Contents</h2>

        {onClose && (
          <button
            className={styles.close}
            onClick={onClose}
            title="Close contents"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {chapters.map(
        (chapter, index) => (
          <button
            key={index}
            className={
              currentPage === index
                ? styles.active
                : styles.item
            }
            onClick={() =>
              onSelect(index)
            }
          >
            <span>
              {index + 1}.
            </span>

            {chapter.title ||
              `Chapter ${
                index + 1
              }`}
          </button>
        )
      )}
    </motion.div>
  );
}

export default TableOfContents;
