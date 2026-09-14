/**
 * PDF generation is fully dynamic:
 * jsPDF + helper modules are only
 * downloaded when the user actually
 * exports a memory book.
 */
export async function generateMemoryBook({
  story,
  moments,
  achievements,
}) {
  const [
    { jsPDF },
    { addCoverPage },
    { addStatsPage },
    { addTimelinePages },
    { addMemoryPages },
    { addAchievementsPage },
    { addClosingPage },
  ] = await Promise.all([
    import("jspdf"),
    import("./addCoverPage"),
    import("./addStatsPage"),
    import("./addTimelinePages"),
    import("./addMemoryPages"),
    import("./addAchievementsPage"),
    import("./addClosingPage"),
  ]);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  //---------------------------------------
  // Cover
  //---------------------------------------

  await addCoverPage(pdf, story);

  pdf.addPage();

  await addStatsPage(pdf, moments);

  pdf.addPage();

  await addTimelinePages(
    pdf,
    moments
  );

  await addMemoryPages(
    pdf,
    moments
  );

  pdf.addPage();

  await addAchievementsPage(
    pdf,
    achievements
  );

  await addClosingPage(pdf);

  pdf.save(
    `${story?.title || "Momentry"}.pdf`
      .replace(/[^\w\d-]+/g, "-")
  );
}
