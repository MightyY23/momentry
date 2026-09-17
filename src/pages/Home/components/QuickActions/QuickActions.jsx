import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import styles from "./QuickActions.module.css";

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: "➕",
      title: "Add Memory",
      description:
        "Capture a new special moment.",
      route: "/add-moment",
      color: styles.pink,
    },
    {
      icon: "📷",
      title: "Gallery",
      description:
        "Browse every memory together.",
      route: "/gallery",
      color: styles.orange,
    },
    {
      icon: "📖",
      title: "StoryBook",
      description:
        "Read your love story.",
      route: "/storybook",
      color: styles.purple,
    },
    {
      icon: "📊",
      title: "Monthly Recap",
      description:
        "Your month in memories.",
      route: "/recap",
      color: styles.blue,
    },
    {
      icon: "🗺️",
      title: "Memory Map",
      description:
        "Places you've been together.",
      route: "/memory-map",
      color: styles.blue,
    },
    {
      icon: "✨",
      title: "On This Day",
      description:
        "Relive past-year memories.",
      route: "/on-this-day",
      color: styles.pink,
    },
    {
      icon: "👤",
      title: "Profile",
      description:
        "Manage your account.",
      route: "/profile",
      color: styles.green,
    },
    {
      icon: "⚙️",
      title: "Settings",
      description:
        "Customize your experience.",
      route: "/settings",
      color: styles.gray,
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.badge}>
          ⚡ Dashboard
        </span>

        <h2>Quick Actions</h2>

        <p>
          Jump to your favorite
          features instantly.
        </p>
      </div>

      <div className={styles.grid}>
        {actions.map(
          (action, index) => (
            <motion.div
              key={action.title}
              className={styles.card}
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index * 0.08,
              }}
              whileHover={{
                y: -8,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={() =>
                navigate(
                  action.route
                )
              }
            >
              <div
                className={`${styles.icon} ${action.color}`}
              >
                {action.icon}
              </div>

              <div
                className={styles.info}
              >
                <h3>
                  {action.title}
                </h3>

                <p>
                  {
                    action.description
                  }
                </p>
              </div>

              <span
                className={
                  styles.arrow
                }
              >
                →
              </span>
            </motion.div>
          )
        )}
      </div>
    </section>
  );
}

export default QuickActions;