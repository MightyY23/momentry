export async function addAchievementsPage(
  pdf,
  achievements = []
) {
  //---------------------------------------
  // Title
  //---------------------------------------

  pdf.setFillColor(
    255,
    240,
    246
  );

  pdf.rect(
    0,
    0,
    210,
    40,
    "F"
  );

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(24);

  pdf.text(
    "🏆 Achievement Collection",
    105,
    25,
    {
      align: "center",
    }
  );

  //---------------------------------------
  // Stats
  //---------------------------------------

  const unlocked =
    achievements.filter(
      (a) => a.unlocked
    ).length;

  //---------------------------------------

  let y = 55;

  achievements.forEach(
    (achievement) => {

      pdf.setDrawColor(
        230
      );

      pdf.roundedRect(
        18,
        y - 8,
        174,
        18,
        3,
        3
      );

      pdf.setFontSize(13);

      pdf.text(
        `${achievement.icon} ${achievement.title}`,
        25,
        y + 2
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        achievement.unlocked
          ? "✓"
          : "Locked",
        180,
        y + 2,
        {
          align: "right",
        }
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      y += 24;
    }
  );

  //---------------------------------------
  // Summary
  //---------------------------------------

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(18);

  pdf.text(
    `Unlocked: ${unlocked}/${achievements.length}`,
    20,
    230
  );

  const percentage =
    achievements.length
      ? Math.round(
          (unlocked /
            achievements.length) *
            100
        )
      : 0;

  pdf.setFontSize(14);

  pdf.text(
    `Completion: ${percentage}%`,
    20,
    245
  );

  //---------------------------------------
  // Quote
  //---------------------------------------

  pdf.setFont(
    "times",
    "italic"
  );

  pdf.setFontSize(16);

  pdf.text(
    "Keep creating memories ❤️",
    105,
    275,
    {
      align: "center",
    }
  );
}