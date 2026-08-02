import {
  getUnlockedAchievements,
  saveUnlockedAchievements,
} from "./achievementStorage";

export function getAchievements(moments = []) {
  //---------------------------------------
  // Statistics
  //---------------------------------------

  const total = moments.length;

  const favorites = moments.filter(
    (m) => m.is_favorite
  ).length;

  const locations = new Set(
    moments
      .filter((m) => m.location)
      .map((m) => m.location)
  ).size;

  const photos = moments.filter(
    (m) => m.image_url
  ).length;

  const words = moments.reduce(
    (sum, moment) =>
      sum +
      (moment.description
        ?.trim()
        .split(/\s+/).length || 0),
    0
  );

  //---------------------------------------
  // Achievement List
  //---------------------------------------

  const achievements = [
    {
      id: "first-memory",
      icon: "🥇",
      title: "First Memory",
      description:
        "Create your very first memory.",
      progress: Math.min(total, 1),
      target: 1,
      unlocked: total >= 1,
    },

    {
      id: "memory-keeper",
      icon: "❤️",
      title: "Memory Keeper",
      description:
        "Save 100 memories.",
      progress: total,
      target: 100,
      unlocked: total >= 100,
    },

    {
      id: "favorite-collector",
      icon: "⭐",
      title:
        "Favorite Collector",
      description:
        "Mark 25 memories as favorite.",
      progress: favorites,
      target: 25,
      unlocked: favorites >= 25,
    },

    {
      id: "photographer",
      icon: "📸",
      title: "Photographer",
      description:
        "Upload 20 photos.",
      progress: photos,
      target: 20,
      unlocked: photos >= 20,
    },

    {
      id: "traveler",
      icon: "🌍",
      title: "Traveler",
      description:
        "Visit 10 unique places.",
      progress: locations,
      target: 10,
      unlocked: locations >= 10,
    },

    {
      id: "story-writer",
      icon: "📖",
      title: "Story Writer",
      description:
        "Write 5,000 words.",
      progress: words,
      target: 5000,
      unlocked: words >= 5000,
    },
  ].map((achievement) => ({
    ...achievement,

    percentage: Math.min(
      Math.round(
        (achievement.progress /
          achievement.target) *
          100
      ),
      100,
    ),
  }));

  //---------------------------------------
  // Detect New Unlocks
  //---------------------------------------

  const previousUnlocked =
    getUnlockedAchievements();

  const currentUnlocked =
    achievements
      .filter((a) => a.unlocked)
      .map((a) => a.id);

  const newlyUnlocked =
    achievements.filter(
      (achievement) =>
        achievement.unlocked &&
        !previousUnlocked.includes(
          achievement.id
        )
    );

  saveUnlockedAchievements(
    currentUnlocked
  );

  //---------------------------------------

  return {
    achievements,
    newlyUnlocked,
  };
}