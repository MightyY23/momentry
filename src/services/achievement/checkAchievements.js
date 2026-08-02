import { getAchievements } from "./achievementEngine";

import {
  getUnlockedAchievements,
  saveUnlockedAchievements,
} from "./achievementStorage";

export function checkAchievements(
  moments
) {
  const { achievements } =
    getAchievements(moments);

  const previous =
    getUnlockedAchievements();

  const current =
    achievements
      .filter((a) => a.unlocked)
      .map((a) => a.id);

  const newlyUnlocked =
    achievements.filter(
      (achievement) =>
        achievement.unlocked &&
        !previous.includes(
          achievement.id
        )
    );

  saveUnlockedAchievements(
    current
  );

  return newlyUnlocked;
}