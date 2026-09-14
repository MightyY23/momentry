import { motion } from "framer-motion";
import { Mail, CalendarDays, ShieldCheck } from "lucide-react";

import styles from "./AccountInfo.module.css";

function formatDate(isoDate) {
  if (!isoDate) return "—";

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric",
    }
  );
}

function AccountInfo({
  user,
  profile,
}) {
  return (
    <motion.section
      className={styles.section}
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay: 0.1,
      }}
    >
      <h2>
        🔐 Account
      </h2>

      <ul
        className={styles.list}
      >
        <li>
          <Mail size={17} />

          <span
            className={
              styles.label
            }
          >
            Email
          </span>

          <span
            className={
              styles.value
            }
          >
            {user?.email ||
              "—"}
          </span>
        </li>

        <li>
          <CalendarDays
            size={17}
          />

          <span
            className={
              styles.label
            }
          >
            Member since
          </span>

          <span
            className={
              styles.value
            }
          >
            {formatDate(
              user?.created_at
            )}
          </span>
        </li>

        <li>
          <ShieldCheck
            size={17}
          />

          <span
            className={
              styles.label
            }
          >
            Display name
          </span>

          <span
            className={
              styles.value
            }
          >
            {profile?.full_name ||
              user?.user_metadata
                ?.full_name ||
              "Not set"}
          </span>
        </li>
      </ul>
    </motion.section>
  );
}

export default AccountInfo;
