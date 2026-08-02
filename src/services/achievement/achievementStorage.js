const STORAGE_KEY =
  "momentry_unlocked_achievements";

export function getUnlockedAchievements() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    ) || [];
  } catch {
    return [];
  }
}

export function saveUnlockedAchievements(ids) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(ids)
  );
}