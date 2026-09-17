/**
 * PDF generation is fully dynamic:
 * jsPDF + helper modules are only
 * downloaded when the user actually
 * exports a memory book.
 *
 * `book` (optional) is the AI-written
 * StoryBook { title, summary, chapters } —
 * when present its chapters are rendered
 * as full story pages after the cover.
 */
export async function generateMemoryBook({
  story,
  moments,
  achievements,
  book,
}) {
  const [
    { jsPDF },
    { addCoverPage },
    { addStatsPage },
    { addTimelinePages },
    { addMemoryPages },
    { addAchievementsPage },
    { addClosingPage },
    { addChapterPages },
  ] = await Promise.all([
    import("jspdf"),
    import("./addCoverPage"),
    import("./addStatsPage"),
    import("./addTimelinePages"),
    import("./addMemoryPages"),
    import("./addAchievementsPage"),
    import("./addClosingPage"),
    import("./addChapterPages"),
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

  //---------------------------------------
  // AI-written story chapters (when the
  // StoryBook has been generated). Rendered
  // right after the cover so the exported
  // PDF contains the full narrative.
  //---------------------------------------

  const chapterList =
    Array.isArray(book?.chapters)
      ? book.chapters
      : [];

  if (chapterList.length > 0) {
    await addChapterPages(pdf, {
      title: book.title || story?.title,
      summary: book.summary || "",
      chapters: chapterList,
    });
  }

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
