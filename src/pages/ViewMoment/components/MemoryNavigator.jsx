import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import Button from "../../../ui/Button/Button";

import styles from "./MemoryNavigator.module.css";

function MemoryNavigator({
  previous,
  next,
  onPrevious,
  onNext,
}) {
  return (
    <motion.section
      className={styles.section}
      initial={{
        opacity: 0,
        y: 25,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
    >
      <div className={styles.header}>
        <span className={styles.badge}>
          📖 Continue the Story
        </span>

        <h2>Browse Memories</h2>

        <p>
          Move backward or forward
          through your journey.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Previous */}

        <motion.div
          whileHover={{
            y: -6,
          }}
          className={styles.card}
        >
          <div className={styles.side}>
            <ArrowLeft size={28} />
          </div>

          <div className={styles.content}>
            <span>
              Previous Memory
            </span>

            <h3>
              {previous
                ? previous.title
                : "No previous memory"}
            </h3>
          </div>

          <Button
            variant="secondary"
            disabled={!previous}
            onClick={onPrevious}
          >
            Previous
          </Button>
        </motion.div>

        {/* Next */}

        <motion.div
          whileHover={{
            y: -6,
          }}
          className={styles.card}
        >
          <div className={styles.side}>
            <ArrowRight size={28} />
          </div>

          <div className={styles.content}>
            <span>
              Next Memory
            </span>

            <h3>
              {next
                ? next.title
                : "No next memory"}
            </h3>
          </div>

          <Button
            disabled={!next}
            onClick={onNext}
          >
            Next
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default MemoryNavigator;