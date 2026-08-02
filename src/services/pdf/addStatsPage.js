export async function addStatsPage(
  pdf,
  moments = []
) {
  //---------------------------------------
  // Calculate Statistics
  //---------------------------------------

  const total = moments.length;

  const favorites = moments.filter(
    (m) => m.is_favorite
  ).length;

  const photos = moments.filter(
    (m) => m.image_url
  ).length;

  const locations = new Set(
    moments
      .filter((m) => m.location)
      .map((m) => m.location)
  ).size;

  const words = moments.reduce(
    (sum, moment) =>
      sum +
      (
        moment.description
          ?.trim()
          .split(/\s+/).length || 0
      ),
    0
  );

  //---------------------------------------
  // Title
  //---------------------------------------

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(24);

  pdf.text(
    "Memory Statistics",
    105,
    25,
    {
      align: "center",
    }
  );

  //---------------------------------------
  // Helper
  //---------------------------------------

  function stat(
    y,
    icon,
    label,
    value
  ) {
    pdf.setDrawColor(
      230,
      230,
      230
    );

    pdf.roundedRect(
      20,
      y - 8,
      170,
      16,
      3,
      3
    );

    pdf.setFontSize(14);

    pdf.text(
      `${icon} ${label}`,
      28,
      y + 2
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.text(
      String(value),
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
  }

  //---------------------------------------

  stat(
    50,
    "❤️",
    "Total Memories",
    total
  );

  stat(
    72,
    "📍",
    "Places Visited",
    locations
  );

  stat(
    94,
    "📸",
    "Photos",
    photos
  );

  stat(
    116,
    "⭐",
    "Favorites",
    favorites
  );

  stat(
    138,
    "📖",
    "Words Written",
    words
  );

  //---------------------------------------
  // Footer
  //---------------------------------------

  pdf.setFontSize(11);

  pdf.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    105,
    285,
    {
      align: "center",
    }
  );
}