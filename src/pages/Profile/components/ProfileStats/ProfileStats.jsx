import StatCard from "./StatCard";

import styles from "./ProfileStats.module.css";

function ProfileStats({
  moments,
}) {
  const total = moments.length;

  const favorites = moments.filter(
    (m) => m.is_favorite
  ).length;

  const locations = new Set(
    moments
      .filter((m) => m.location)
      .map((m) => m.location)
  ).size;

  const years = new Set(
    moments.map((m) =>
      new Date(m.memory_date).getFullYear()
    )
  ).size;

  const stats = [
    {
      icon: "❤️",
      value: total,
      label: "Memories",
    },
    {
      icon: "⭐",
      value: favorites,
      label: "Favorites",
    },
    {
      icon: "📍",
      value: locations,
      label: "Places",
    },
    {
      icon: "📅",
      value: years,
      label: "Years",
    },
  ];

  return (
    <div className={styles.grid}>
      {stats.map((item, index) => (
        <StatCard
          key={item.label}
          {...item}
          delay={index * 0.08}
        />
      ))}
    </div>
  );
}

export default ProfileStats;