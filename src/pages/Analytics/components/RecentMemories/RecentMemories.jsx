import RecentMemoryCard from "../RecentMemoryCard/RecentMemoryCard";

import styles from "./RecentMemories.module.css";

function RecentMemories({ moments }) {

  const recent = [...moments]
    .sort(
      (a, b) =>
        new Date(b.memory_date) -
        new Date(a.memory_date)
    )
    .slice(0, 10);

  return (
    <section className={styles.section}>

      <div className={styles.header}>

        <h2>📸 Recent Memories</h2>

        <span>
          {recent.length} memories
        </span>

      </div>

      <div className={styles.list}>

        {recent.map((moment, index) => (

          <RecentMemoryCard
            key={moment.id}
            moment={moment}
            index={index}
          />

        ))}

      </div>

    </section>
  );
}

export default RecentMemories;