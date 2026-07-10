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
        {story &&
          `Together since ${new Date(
            story.created_at
          ).toLocaleDateString()}`}
      </p>
    </motion.div>
  );
}

export default StoryHeader;