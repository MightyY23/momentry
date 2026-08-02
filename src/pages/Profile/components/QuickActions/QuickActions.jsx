import { useNavigate } from "react-router-dom";

import QuickActionCard from "./QuickActionCard";

import styles from "./QuickActions.module.css";

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: "➕",
      title: "Add Memory",
      subtitle: "Create a new memory",
      path: "/add-moment",
    },
    {
      icon: "📸",
      title: "Gallery",
      subtitle: "Browse photos",
      path: "/gallery",
    },
    {
      icon: "📖",
      title: "StoryBook",
      subtitle: "Read your journey",
      path: "/storybook",
    },
    {
      icon: "🗺",
      title: "Memory Map",
      subtitle: "Explore locations",
      path: "/memory-map",
    },
    {
      icon: "🏠",
      title: "Timeline",
      subtitle: "View your story",
      path: "/home",
    },
    {
      icon: "⚙",
      title: "Settings",
      subtitle: "Coming Soon",
      path: null,
    },
  ];

  return (
    <section className={styles.section}>
      <h2>⚡ Quick Actions</h2>

      <div className={styles.grid}>
        {actions.map((action, index) => (
          <QuickActionCard
            key={action.title}
            icon={action.icon}
            title={action.title}
            subtitle={action.subtitle}
            delay={index * 0.08}
            onClick={() => {
              if (action.path) {
                navigate(action.path);
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default QuickActions;