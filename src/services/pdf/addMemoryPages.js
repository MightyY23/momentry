import { imageToBase64 } from "./imageUtils";

export async function addMemoryPages(
  pdf,
  moments = []
) {
  //---------------------------------------
  // Sort
  //---------------------------------------

  const sorted = [...moments].sort(
    (a, b) =>
      new Date(a.memory_date) -
      new Date(b.memory_date)
  );

  //---------------------------------------

  for (const moment of sorted) {
    pdf.addPage();

    //---------------------------------------
    // Header
    //---------------------------------------

    pdf.setFillColor(255, 240, 246);

    pdf.rect(0, 0, 210, 45, "F");

    //---------------------------------------

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(24);

    pdf.text(
      moment.title || "Untitled Memory",
      20,
      25
    );

    //---------------------------------------
    // Date
    //---------------------------------------

    pdf.setFontSize(12);

    pdf.setFont("helvetica", "normal");

    if (moment.memory_date) {
      pdf.text(
        new Date(
          moment.memory_date
        ).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        20,
        35
      );
    }

    //---------------------------------------
    // Favorite badge
    //---------------------------------------

    if (moment.is_favorite) {
      pdf.setFont("helvetica", "bold");

      pdf.setFontSize(12);

      pdf.setTextColor(200, 60, 110);

      pdf.text("★ Favorite", 190, 35, {
        align: "right",
      });

      pdf.setTextColor(0);

      pdf.setFont("helvetica", "normal");
    }

    //---------------------------------------
    // Description
    //---------------------------------------

    let y = 60;

    pdf.setDrawColor(230);

    pdf.roundedRect(20, y, 170, 75, 4, 4);

    pdf.setFontSize(12);

    const description =
      moment.description ||
      "No description available.";

    const lines = pdf.splitTextToSize(
      description,
      155
    );

    pdf.text(lines, 28, y + 12);

    //---------------------------------------
    // Location
    //---------------------------------------

    if (moment.location) {
      pdf.setFont("helvetica", "italic");

      pdf.setFontSize(11);

      pdf.setTextColor(110);

      pdf.text(
        `📍 ${moment.location}`,
        28,
        y + 68
      );

      pdf.setTextColor(0);

      pdf.setFont("helvetica", "normal");
    }

    //---------------------------------------
    // Photo
    //---------------------------------------

    y += 95;

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(14);

    pdf.text("Memory Photo", 20, y);

    pdf.setDrawColor(170);

    pdf.rect(20, y + 8, 120, 80);

    pdf.setFont("helvetica", "italic");

    pdf.setFontSize(12);

    //---------------------------------------
    // Image
    //---------------------------------------

    if (moment.image_url) {
      try {
        const image = await imageToBase64(
          moment.image_url
        );

        if (image) {
          pdf.addImage(
            image,
            "JPEG",
            20,
            y + 8,
            120,
            80
          );
        }
      } catch (err) {
        console.error(err);

        pdf.text(
          "Unable to load image.",
          55,
          y + 45
        );
      }
    } else {
      pdf.setFontSize(11);

      pdf.text("No Image", 65, y + 45);
    }

    //---------------------------------------
    // Footer
    //---------------------------------------

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(10);

    pdf.setTextColor(130);

    pdf.text(
      "Created with ❤️ using Momentry",
      105,
      288,
      {
        align: "center",
      }
    );

    pdf.setTextColor(0);
  }
}
