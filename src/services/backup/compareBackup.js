export function compareBackup(
  backupMoments = [],
  existingMoments = []
) {
  const existingMap = new Map();

  existingMoments.forEach((moment) => {
    const key = [
      moment.title,
      moment.memory_date,
      moment.location,
    ]
      .join("|")
      .toLowerCase();

    existingMap.set(key, moment);
  });

  const summary = {
    newMemories: [],
    duplicates: [],
    updates: [],
  };

  backupMoments.forEach((moment) => {
    const key = [
      moment.title,
      moment.memory_date,
      moment.location,
    ]
      .join("|")
      .toLowerCase();

    const existing =
      existingMap.get(key);

    if (!existing) {
      summary.newMemories.push(moment);
      return;
    }

    const changed =
      existing.description !==
        moment.description ||
      existing.image_url !==
        moment.image_url ||
      existing.is_favorite !==
        moment.is_favorite;

    if (changed) {
      summary.updates.push({
        existing,
        incoming: moment,
      });
    } else {
      summary.duplicates.push(
        moment
      );
    }
  });

  return summary;
}