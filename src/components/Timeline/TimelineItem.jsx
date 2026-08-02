import { motion } from "framer-motion";

import styles from "./Timeline.module.css";

function TimelineItem({
  children,
  left,
}) {
  return (
    <motion.div
      className={styles.timelineItem}
      initial={{
        opacity: 0,
        x: left ? -80 : 80,
        y: 40,
        scale: 0.95,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {left ? (
        <>
          <div className={styles.left}>
            {children}
          </div>

          <div className={styles.center}>
            <motion.div
              className={styles.node}
              initial={{
                scale: 0,
              }}
              whileInView={{
                scale: 1,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.15,
                duration: 0.35,
              }}
            />
          </div>

          <div />
        </>
      ) : (
        <>
          <div />

          <div className={styles.center}>
            <motion.div
              className={styles.node}
              initial={{
                scale: 0,
              }}
              whileInView={{
                scale: 1,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.15,
                duration: 0.35,
              }}
            />
          </div>

          <div className={styles.right}>
            {children}
          </div>
        </>
      )}
    </motion.div>
  );
}

export default TimelineItem;