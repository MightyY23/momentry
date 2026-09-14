import TimelineCard from "./TimelineCard";

import styles from "./Timeline.module.css";

import { motion } from "framer-motion";

import TimelineYear from "./TimelineYear";
import TimelineMonth from "./TimelineMonth";
import TimelineItem from "./TimelineItem";

import { groupMoments } from "../../utils/groupMoments";

function Timeline({
  moments,
  onOpenMoment,
  onAddMoment,
  onToggleFavorite,
}) {
  const grouped = groupMoments(moments);

  //---------------------------------------
  // Empty State
  //---------------------------------------

  if (!moments.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.heart}>
          ❤️
        </div>

        <h2>Your journey starts here</h2>

        <p>
          Create your first memory to begin
          your story.
        </p>

        <button
          className={styles.primaryButton}
          onClick={onAddMoment}
        >
          Create First Memory
        </button>
      </div>
    );
  }

  //---------------------------------------
  // Global alternating index
  //---------------------------------------

  let globalIndex = 0;

  return (
    <motion.div
      className={styles.timeline}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className={styles.header}>
    <span className={styles.badge}>
        📖 Story Timeline
    </span>

    <h2 className={styles.heading}>
        Your Journey Together
    </h2>

    <p className={styles.subtitle}>
        Every memory is another beautiful chapter in your story.
    </p>
</div>

      {Object.entries(grouped).map(
        ([year, months]) => (
          <TimelineYear
            key={year}
            year={year}
          >
            {Object.entries(months).map(
              ([month, items]) => (
                <TimelineMonth
                  key={month}
                  month={month}
                >
                  {items.map((moment) => {
                    const isLeft =
                      globalIndex % 2 ===
                      0;

                    globalIndex++;

                    return (
                      <TimelineItem
                        key={moment.id}
                        left={isLeft}
                      >
                        <TimelineCard
                          moment={moment}
                          onClick={() =>
                            onOpenMoment(
                              moment.id
                            )
                          }
                          onToggleFavorite={
                            onToggleFavorite
                          }
                        />
                      </TimelineItem>
                    );
                  })}
                </TimelineMonth>
              )
            )}
          </TimelineYear>
        )
      )}

      <div className={styles.footer}>
        <button
          className={styles.primaryButton}
          onClick={onAddMoment}
        >
          + Add New Chapter
        </button>
      </div>
    </motion.div>
  );
}

export default Timeline;