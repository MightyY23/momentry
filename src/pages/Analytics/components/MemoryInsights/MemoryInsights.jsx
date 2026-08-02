import InsightCard from "../InsightCard/InsightCard";

import styles from "./MemoryInsights.module.css";

function MemoryInsights({ moments }) {

  if (!moments.length) return null;

  //---------------------------------------
  // Earliest & Latest Time
  //---------------------------------------

  const hours = moments
    .filter((m) => m.memory_date)
    .map(
      (m) =>
        new Date(
          m.memory_date
        ).getHours()
    );

  const earliest =
    Math.min(...hours);

  const latest =
    Math.max(...hours);

  //---------------------------------------
  // Favorite %
  //---------------------------------------

  const favoritePercent =
    Math.round(
      (moments.filter(
        (m) => m.is_favorite
      ).length /
        moments.length) *
        100
    );

  //---------------------------------------
  // Photo %
  //---------------------------------------

  const photoCoverage =
    Math.round(
      (moments.filter(
        (m) => m.image_url
      ).length /
        moments.length) *
        100
    );

  //---------------------------------------
  // Average Description
  //---------------------------------------

  const averageWords =
    Math.round(
      moments.reduce(
        (sum, moment) =>
          sum +
          (
            moment.description
              ?.trim()
              .split(/\s+/)
              .length || 0
          ),
        0
      ) / moments.length
    );

  //---------------------------------------
  // Memories / Month
  //---------------------------------------

  const months = new Set(
    moments.map((m) => {
      const date = new Date(
        m.memory_date
      );

      return `${date.getFullYear()}-${date.getMonth()}`;
    })
  ).size;

  const averagePerMonth =
    (
      moments.length /
      Math.max(months, 1)
    ).toFixed(1);

  //---------------------------------------
  // Most Active Weekday
  //---------------------------------------

  const weekdays = {};

  moments.forEach((moment) => {
    const day =
      new Date(
        moment.memory_date
      ).toLocaleDateString(
        "default",
        {
          weekday: "long",
        }
      );

    weekdays[day] =
      (weekdays[day] || 0) + 1;
  });

  const bestDay =
    Object.entries(
      weekdays
    ).sort(
      (a, b) =>
        b[1] - a[1]
    )[0]?.[0];

  //---------------------------------------
  // Journey Length
  //---------------------------------------

  const dates = moments
    .map(
      (m) =>
        new Date(
          m.memory_date
        )
    )
    .sort((a, b) => a - b);

  const days =
    Math.floor(
      (dates.at(-1) - dates[0]) /
        86400000
    ) + 1;

  //---------------------------------------

  const insights = [
    {
      icon: "🌅",
      title: "Earliest Memory",
      value: `${earliest}:00`,
    },
    {
      icon: "🌙",
      title: "Latest Memory",
      value: `${latest}:00`,
    },
    {
      icon: "❤️",
      title: "Favorite %",
      value: `${favoritePercent}%`,
    },
    {
      icon: "📷",
      title: "Photo Coverage",
      value: `${photoCoverage}%`,
    },
    {
      icon: "📝",
      title: "Average Description",
      value: `${averageWords} words`,
    },
    {
      icon: "📅",
      title: "Memories / Month",
      value: averagePerMonth,
    },
    {
      icon: "🎉",
      title: "Favorite Weekday",
      value: bestDay,
    },
    {
      icon: "⏳",
      title: "Journey Length",
      value: `${days} days`,
    },
  ];

  return (
    <section>
      <h2 className={styles.heading}>
        💡 Memory Insights
      </h2>

      <div className={styles.grid}>
        {insights.map(
          (item, index) => (
            <InsightCard
              key={item.title}
              {...item}
              delay={index * 0.05}
            />
          )
        )}
      </div>
    </section>
  );
}

export default MemoryInsights;