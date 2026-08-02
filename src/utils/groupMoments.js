export function groupMoments(moments) {
  const grouped = {};

  const sorted = [...moments].sort(
    (a, b) =>
      new Date(b.memory_date) -
      new Date(a.memory_date)
  );

  sorted.forEach((moment) => {
    const date = new Date(moment.memory_date);

    const year = date.getFullYear();

    const month = date.toLocaleString(
      "default",
      {
        month: "long",
      }
    );

    if (!grouped[year]) {
      grouped[year] = {};
    }

    if (!grouped[year][month]) {
      grouped[year][month] = [];
    }

    grouped[year][month].push(moment);
  });

  return grouped;
}