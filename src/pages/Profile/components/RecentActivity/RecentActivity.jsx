import ActivityCard from "./ActivityCard";

import styles from "./RecentActivity.module.css";

function RecentActivity({
  moments,
  onOpen,
}) {
  const recent = [...moments]
    .sort(
      (a, b) =>
        new Date(b.memory_date) -
        new Date(a.memory_date)
    )
    .slice(0, 5);

  return (
    <section className={styles.section}>
      <h2>🕒 Recent Activity</h2>

      {recent.length === 0 ? (
        <p>
          No recent memories yet.
        </p>
      ) : (
        <div className={styles.list}>
          {recent.map(
            (moment, index) => (
              <ActivityCard
                key={moment.id}
                moment={moment}
                delay={index * 0.08}
                onOpen={onOpen}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

export default RecentActivity;