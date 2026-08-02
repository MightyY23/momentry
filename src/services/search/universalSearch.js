import { searchMemories } from "./searchEngine";

//---------------------------------------

function normalize(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim();
}

//---------------------------------------

export function searchEverything({
  query,
  moments = [],
  achievements = [],
  storybook = [],
}) {
  const search = normalize(query);

  if (!search) return [];

  //---------------------------------------
  // Memories
  //---------------------------------------

  const memoryResults =
    searchMemories(
      moments,
      query
    ).map((memory) => ({
      type: "memory",

      title: memory.title,

      subtitle:
        memory.location ||

        "Memory",

      icon: "❤️",

      data: memory,
    }));

  //---------------------------------------
  // Achievements
  //---------------------------------------

  const achievementResults =
    achievements
      .filter((achievement) =>
        achievement.title
          .toLowerCase()
          .includes(search)
      )
      .map((achievement) => ({
        type: "achievement",

        title: achievement.title,

        subtitle:
          achievement.description,

        icon: "🏆",

        data: achievement,
      }));

  //---------------------------------------
  // StoryBook
  //---------------------------------------

  const storyResults =
    storybook
      .filter((chapter) =>
        chapter.title
          ?.toLowerCase()
          .includes(search)
      )
      .map((chapter) => ({
        type: "storybook",

        title: chapter.title,

        subtitle:
          "StoryBook",

        icon: "📖",

        data: chapter,
      }));

  //---------------------------------------

  return [

    ...memoryResults,

    ...achievementResults,

    ...storyResults,

  ];
}