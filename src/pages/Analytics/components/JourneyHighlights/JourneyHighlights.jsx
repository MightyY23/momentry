import HighlightCard from "../HighlightCard/HighlightCard";

import styles from "./JourneyHighlights.module.css";

function JourneyHighlights({
  moments,
}) {

  //---------------------------------------
  // Favorite Place
  //---------------------------------------

  const placeCounts = {};

  moments.forEach((moment) => {

    if (!moment.location) return;

    placeCounts[moment.location] =
      (placeCounts[moment.location] || 0) + 1;

  });

  const favoritePlace =
    Object.entries(placeCounts)
      .sort((a, b) => b[1] - a[1])[0];

  //---------------------------------------
  // First Memory
  //---------------------------------------

  const sorted = [...moments].sort(
    (a, b) =>
      new Date(a.memory_date) -
      new Date(b.memory_date)
  );

  const firstMemory = sorted[0];

  //---------------------------------------
  // Most Active Month
  //---------------------------------------

  const months = {};

  moments.forEach((moment) => {

    const month =
      new Date(
        moment.memory_date
      ).toLocaleString(
        "default",
        {
          month: "long",
        }
      );

    months[month] =
      (months[month] || 0) + 1;

  });

  const activeMonth =
    Object.entries(months)
      .sort((a, b) => b[1] - a[1])[0];

  //---------------------------------------

  return (

    <div className={styles.grid}>

      <HighlightCard
        icon="🏆"
        title="Favorite Place"
        value={
          favoritePlace
            ? favoritePlace[0]
            : "-"
        }
        subtitle={
          favoritePlace
            ? `${favoritePlace[1]} memories`
            : "No locations yet"
        }
        delay={0}
      />

      <HighlightCard
        icon="📅"
        title="Most Active Month"
        value={
          activeMonth
            ? activeMonth[0]
            : "-"
        }
        subtitle={
          activeMonth
            ? `${activeMonth[1]} memories`
            : ""
        }
        delay={0.1}
      />

      <HighlightCard
        icon="❤️"
        title="First Memory"
        value={
          firstMemory
            ? firstMemory.title
            : "-"
        }
        subtitle={
          firstMemory
            ? new Date(
                firstMemory.memory_date
              ).toLocaleDateString()
            : ""
        }
        delay={0.2}
      />

      <HighlightCard
        icon="📷"
        title="Photos"
        value={
          moments.filter(
            m => m.image_url
          ).length
        }
        subtitle="Captured memories"
        delay={0.3}
      />

    </div>

  );

}

export default JourneyHighlights;