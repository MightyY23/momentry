import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

import styles from "./ProfileHero.module.css";

function ProfileHero({
  user,
  profile,
  story,
  totalMemories,
  onEdit,
}) {
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    "Momentry User";

  const avatarUrl = profile?.avatar_url;

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
      <button
        type="button"
        className={styles.editButton}
        onClick={onEdit}
        aria-label="Edit profile"
      >
        <Pencil size={16} />

        Edit
      </button>

      <div className={styles.avatar}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
          />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>

      <h1>
        {displayName}
      </h1>

      <p className={styles.email}>
        {user?.email}
      </p>

      <h2 className={styles.story}>
        ❤️ {story?.title || "Our Story"}
      </h2>

      <p className={styles.subtitle}>
        {totalMemories}{' '}
        {totalMemories === 1 ? "memory" : "memories"}{' '}
        preserved forever.
      </p>
    </motion.div>
  );
}

export default ProfileHero;
