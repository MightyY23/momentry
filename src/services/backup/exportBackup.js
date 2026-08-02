import { getUnlockedAchievements } from "../achievement/achievementStorage";

export function exportBackup({
  story,
  moments,
  settings = {},
}) {
  const backup = {
    version: "1.0",

    app: "Momentry",

    exportedAt:
      new Date().toISOString(),

    story,

    moments,

    settings,

    achievements:
      getUnlockedAchievements(),
  };

  //---------------------------------------

  const json = JSON.stringify(
    backup,
    null,
    2
  );

  const blob = new Blob(
    [json],
    {
      type: "application/json",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    `Momentry_Backup_${
      new Date()
        .toISOString()
        .split("T")[0]
    }.json`;

  a.click();

  URL.revokeObjectURL(url);
}