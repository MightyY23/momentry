import { motion } from "framer-motion";
import styles from "./StoryHeader.module.css";

function StoryHeader({ story }) {
  return (
    <motion.div
      className={styles.book}
      initial={{ opacity: 0, y: -60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
    >
      <div className={styles.emoji}>❤️</div>

      <h1 className={styles.title}>
        {story?.title ?? "Our Story"}
      </h1>

      <p className={styles.date}>
        Every memory tells a story.
        <br />
        Every chapter deserves to be remembered.
        <br />
        <br />
        {story?.anniversary_date &&
          `Together since ${new Date(
            story.anniversary_date
          ).toLocaleDateString(
            undefined,
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )}`}
        {!story?.anniversary_date && story &&
          `First memory: ${new Date(
            story.created_at
          ).toLocaleDateString()}`}
      </p>
    </motion.div>
  );
}

export default StoryHeader;