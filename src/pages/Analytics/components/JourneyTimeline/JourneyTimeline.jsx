import TimelineYear from "../TimelineYear/TimelineYear";

import styles from "./JourneyTimeline.module.css";

function JourneyTimeline({
  moments,
}) {

  const grouped = {};

  moments.forEach((moment) => {

    const year =
      new Date(
        moment.memory_date
      ).getFullYear();

    if (!grouped[year]) {
      grouped[year] = [];
    }

    grouped[year].push(moment);

  });

  const years =
    Object.keys(grouped)
      .sort();

  return (

    <section
      className={styles.section}
    >

      <h2>

        📖 Journey Timeline

      </h2>

      {years.map(
        (year, index) => (

          <TimelineYear
            key={year}
            year={year}
            moments={grouped[year]}
            delay={index * 0.1}
          />

        )
      )}

    </section>

  );

}

export default JourneyTimeline;