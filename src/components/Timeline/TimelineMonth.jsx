import { motion } from "framer-motion";

import styles from "./Timeline.module.css";

function TimelineMonth({
  month,
  children,
}) {
  return (
    <motion.section
      className={styles.monthSection}
      aria-label={`${month} memories`}
      initial={{
        opacity: 0,
        y: 35,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* ===========================
            MONTH HEADER
      =========================== */}

      <div className={styles.monthHeader}>
        <motion.div
          className={styles.monthLine}
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
            duration: 0.55,
            delay: 0.1,
          }}
          style={{
            transformOrigin: "right",
          }}
        />

        <motion.h3
          className={styles.month}
          initial={{
            opacity: 0,
            scale: 0.85,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.4,
            delay: 0.2,
          }}
        >
          {month}
        </motion.h3>

        <motion.div
          className={styles.monthLine}
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
            duration: 0.55,
            delay: 0.1,
          }}
          style={{
            transformOrigin: "left",
          }}
        />
      </div>

      {/* ===========================
            MONTH CONTENT
      =========================== */}

      <motion.div
        className={styles.monthContent}
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
          delay: 0.25,
        }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
}

export default TimelineMonth;