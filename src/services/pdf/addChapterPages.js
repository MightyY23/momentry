import { imageToBase64 } from "./imageUtils";

//----------------------------------------
// AI story chapters as full PDF pages.
//
// A summary page opens the narrative, then
// each chapter gets one page with its
// title, full text (paginated), and its
// source memory's photo when available.
//----------------------------------------

export async function addChapterPages(
  pdf,
  book = {}
) {
  const chapters = Array.isArray(
    book.chapters
  )
    ? book.chapters
    : [];

  if (chapters.length === 0) return;

  //---------------------------------------
  // Story summary page
  //---------------------------------------

  pdf.addPage();

  pdf.setFillColor(255, 240, 246);

  pdf.rect(0, 0, 210, 297, "F");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(26);

  pdf.text(
    pdf.splitTextToSize(
      book.title || "Our Story",
      170
    ),
    105,
    70,
    { align: "center" }
  );

  pdf.setFont("times", "italic");

  pdf.setFontSize(15);

  if (book.summary) {
    pdf.text(
      pdf.splitTextToSize(book.summary, 150),
      105,
      100,
      { align: "center" }
    );
  }

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(12);

  pdf.setTextColor(120);

  pdf.text(
    `${chapters.length} chapters`,
    105,
    150,
    { align: "center" }
  );

  pdf.setTextColor(0);

  //---------------------------------------
  // One page per chapter
  //---------------------------------------

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];

    pdf.addPage();

    //---------------------------------------
    // Header band
    //---------------------------------------

    pdf.setFillColor(255, 240, 246);

    pdf.rect(0, 0, 210, 40, "F");

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(11);

    pdf.setTextColor(190, 90, 135);

    pdf.text(
      `CHAPTER ${i + 1} OF ${chapters.length}`,
      105,
      16,
      { align: "center" }
    );

    pdf.setTextColor(0);

    pdf.setFontSize(18);

    pdf.text(
      pdf.splitTextToSize(
        chapter.title || "Untitled Chapter",
        180
      ),
      105,
      28,
      { align: "center" }
    );

    //---------------------------------------
    // Optional chapter photo
    //---------------------------------------

    let y = 52;

    if (chapter.image_url) {
      try {
        const image = await imageToBase64(
          chapter.image_url
        );

        if (image) {
          pdf.addImage(
            image,
            "JPEG",
            45,
            y,
            120,
            75
          );

          y += 85;
        }
      } catch {
        // Photo is decorative — skip on failure.
      }
    }

    //---------------------------------------
    // Chapter text — paginated across as
    // many pages as needed
    //---------------------------------------

    pdf.setFont("times", "normal");

    pdf.setFontSize(13);

    const lines = pdf.splitTextToSize(
      chapter.content || "",
      165
    );

    const lineHeight = 7;

    const firstPageCapacity = Math.floor(
      (270 - y) / lineHeight
    );

    let cursor = 0;

    let capacity = Math.max(
      4,
      firstPageCapacity
    );

    while (cursor < lines.length) {
      const slice = lines.slice(
        cursor,
        cursor + capacity
      );

      pdf.text(slice, 22, y);

      cursor += slice.length;

      if (cursor < lines.length) {
        footer(pdf);

        pdf.addPage();

        y = 30;

        capacity = Math.floor(
          (270 - y) / lineHeight
        );
      }
    }

    //---------------------------------------
    // Source memory footnote
    //---------------------------------------

    if (chapter.location || chapter.memory_date) {
      pdf.setFont("helvetica", "italic");

      pdf.setFontSize(10);

      pdf.setTextColor(130);

      const bits = [];

      if (chapter.memory_date) {
        bits.push(
          new Date(
            chapter.memory_date
          ).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        );
      }

      if (chapter.location) {
        bits.push(`📍 ${chapter.location}`);
      }

      pdf.text(
        bits.join("  ·  "),
        105,
        278,
        { align: "center" }
      );

      pdf.setTextColor(0);
    }

    footer(pdf);
  }
}

function footer(pdf) {
  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(10);

  pdf.setTextColor(130);

  pdf.text(
    "Created with ❤️ using Momentry",
    105,
    288,
    { align: "center" }
  );

  pdf.setTextColor(0);
}
