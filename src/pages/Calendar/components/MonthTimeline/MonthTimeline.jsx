import TimelineMemoryCard from "../TimelineMemoryCard/TimelineMemoryCard";

import styles from "./MonthTimeline.module.css";

function MonthTimeline({
  currentDate,
  moments,
}) {
  //---------------------------------------
  // Current Month Memories
  //---------------------------------------

  const monthlyMoments = moments
    .filter((moment) => {
      if (!moment.memory_date)
        return false;

      const date = new Date(
        moment.memory_date
      );

      return (
        date.getMonth() ===
          currentDate.getMonth() &&
        date.getFullYear() ===
          currentDate.getFullYear()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.memory_date) -
        new Date(b.memory_date)
    );

  //---------------------------------------

  const photoCount =
    monthlyMoments.filter(
      (moment) => moment.image_url
    ).length;

  const favoriteCount =
    monthlyMoments.filter(
      (moment) => moment.is_favorite
    ).length;

  const monthTitle =
    currentDate.toLocaleDateString(
      "default",
      {
        month: "long",
        year: "numeric",
      }
    );

  //---------------------------------------

  return (
    <section
      className={styles.container}
      aria-label="Monthly memories"
    >
      <header className={styles.header}>
        <div>
          <span className={styles.label}>
            Monthly Story
          </span>

          <h2>{monthTitle}</h2>

          <p>
            Every memory from this
            month, arranged in
            chronological order.
          </p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>
              {monthlyMoments.length}
            </strong>
            <span>Memories</span>
          </div>

          <div className={styles.stat}>
            <strong>
              {photoCount}
            </strong>
            <span>Photos</span>
          </div>

          <div className={styles.stat}>
            <strong>
              {favoriteCount}
            </strong>
            <span>Favorites</span>
          </div>
        </div>
      </header>

      {monthlyMoments.length ===
      0 ? (
        <div className={styles.empty}>
          <div className={styles.icon}>
            📅
          </div>

          <h3>
            No memories this month
          </h3>

          <p>
            Create beautiful moments
            and they'll appear here in
            chronological order.
          </p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {monthlyMoments.map(
            (moment) => (
              <TimelineMemoryCard
                key={moment.id}
                moment={moment}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

export default MonthTimeline;