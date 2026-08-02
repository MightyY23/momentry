import {
  Heart,
  MapPin,
  Star,
  Camera,
} from "lucide-react";

import StatCard from "../StatCard/StatCard";

import styles from "./StatsGrid.module.css";

function StatsGrid({ moments }) {
  //---------------------------------------
  // Calculations
  //---------------------------------------

  const totalMemories = moments.length;

  const places = new Set(
    moments
      .filter((m) => m.location)
      .map((m) => m.location)
  ).size;

  const favorites = moments.filter(
    (m) => m.is_favorite
  ).length;

  const photos = moments.filter(
    (m) => m.image_url
  ).length;

  //---------------------------------------

  const stats = [
    {
      icon: <Heart size={26} />,
      title: "Memories",
      value: totalMemories,
      subtitle: "Captured moments",
      color: "var(--primary)",
      delay: 0,
    },
    {
      icon: <MapPin size={26} />,
      title: "Places",
      value: places,
      subtitle: "Visited together",
      color: "var(--success)",
      delay: 0.1,
    },
    {
      icon: <Star size={26} />,
      title: "Favorites",
      value: favorites,
      subtitle: "Special memories",
      color: "var(--warning)",
      delay: 0.2,
    },
    {
      icon: <Camera size={26} />,
      title: "Photos",
      value: photos,
      subtitle: "Images saved",
      color: "var(--info)",
      delay: 0.3,
    },
  ];

  //---------------------------------------

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Story Overview</h2>

        <p>Your journey at a glance</p>
      </div>

      <div className={styles.grid}>
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            {...stat}
          />
        ))}
      </div>
    </section>
  );
}

export default StatsGrid;