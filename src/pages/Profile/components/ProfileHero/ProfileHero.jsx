import { motion } from "framer-motion";

import styles from "./ProfileHero.module.css";

function ProfileHero({
  user,
  story,
  totalMemories,
}) {
  return (
    <motion.div
      className={styles.hero}
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
      }}
    >
      <div className={styles.avatar}>
        {user?.email?.charAt(0).toUpperCase()}
      </div>

      <h1>
        {user?.user_metadata?.full_name ||
          "Momentry User"}
      </h1>

      <p className={styles.email}>
        {user?.email}
      </p>

      <h2 className={styles.story}>
        ❤️ {story?.title || "Our Story"}
      </h2>

      <p className={styles.subtitle}>
        {totalMemories} memories preserved forever.
      </p>
    </motion.div>
  );
}

export default ProfileHero;