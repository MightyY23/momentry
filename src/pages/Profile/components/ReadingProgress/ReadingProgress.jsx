import ProgressCard from "./ProgressCard";

import styles from "./ReadingProgress.module.css";

function ReadingProgress({
  moments,
}) {
  //------------------------------------
  // Statistics
  //------------------------------------

  const total = moments.length;

  const words = moments.reduce(
    (sum, moment) =>
      sum +
      (moment.description
        ?.trim()
        .split(/\s+/).length || 0),
    0
  );

  const photos = moments.filter(
    (m) => m.image_url
  ).length;

  const places = new Set(
    moments
      .filter((m) => m.location)
      .map((m) => m.location)
  ).size;

  //------------------------------------
  // Fake completion
  //------------------------------------

  const completion = Math.min(
    Math.round((total / 100) * 100),
    100
  );

  const cards = [
    {
      icon: "📖",
      title: "Chapters",
      value: total,
    },
    {
      icon: "📝",
      title: "Words Written",
      value: words.toLocaleString(),
    },
    {
      icon: "📷",
      title: "Photos",
      value: photos,
    },
    {
      icon: "📍",
      title: "Places",
      value: places,
    },
  ];

  return (
    <section className={styles.section}>
      <h2>📈 Journey Progress</h2>

      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span>Story Completion</span>

          <strong>
            {completion}%
          </strong>
        </div>

        <div className={styles.bar}>
          <div
            className={styles.fill}
            style={{
              width: `${completion}%`,
            }}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {cards.map((card, index) => (
          <ProgressCard
            key={card.title}
            {...card}
            delay={index * 0.08}
          />
        ))}
      </div>
    </section>
  );
}

export default ReadingProgress;