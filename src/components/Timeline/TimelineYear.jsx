import { motion } from "framer-motion";

import styles from "./Timeline.module.css";

function TimelineYear({
  year,
  children,
}) {
  return (
    <motion.section
      className={styles.yearSection}
      aria-labelledby={`year-${year}`}
      initial={{
        opacity: 0,
        y: 40,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* ===========================
            YEAR HEADER
      =========================== */}

      <div className={styles.yearWrapper}>
        <motion.div
          className={styles.yearLine}
          initial={{
            scaleX: 0,
          }}
          whileInView={{
            scaleX: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
            delay: 0.15,
          }}
          style={{
            transformOrigin: "right",
          }}
        />

        <motion.h2
          id={`year-${year}`}
          className={styles.year}
          initial={{
            scale: 0.8,
            opacity: 0,
          }}
          whileInView={{
            scale: 1,
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.45,
            delay: 0.2,
          }}
        >
          {year}
        </motion.h2>

        <motion.div
          className={styles.yearLine}
          initial={{
            scaleX: 0,
          }}
          whileInView={{
            scaleX: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.6,
            delay: 0.15,
          }}
          style={{
            transformOrigin: "left",
          }}
        />
      </div>

      {/* ===========================
            YEAR CONTENT
      =========================== */}

      <motion.div
        className={styles.yearContent}
        initial={{
          opacity: 0,
        }}
        whileInView={{
          opacity: 1,
        }}
        viewport={{
          once: true,
        }}
        transition={{
          duration: 0.45,
          delay: 0.3,
        }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
}

export default TimelineYear;