import { imageToBase64 }
from "./imageUtils";
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

  sorted.forEach((moment) => {
    pdf.addPage();

    //---------------------------------------
    // Header
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
      45,
      "F"
    );

    //---------------------------------------

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(24);

    pdf.text(
      moment.title ||
        "Untitled Memory",
      20,
      25
    );

    //---------------------------------------
    // Date
    //---------------------------------------

    pdf.setFontSize(12);

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.text(
      `📅 ${new Date(
        moment.memory_date
      ).toLocaleDateString()}`,
      20,
      38
    );

    //---------------------------------------
    // Location
    //---------------------------------------

    let y = 60;

    if (moment.location) {
      pdf.setFontSize(13);

      pdf.text(
        `📍 ${moment.location}`,
        20,
        y
      );

      y += 12;
    }

    //---------------------------------------
    // Favorite Badge
    //---------------------------------------

    if (moment.is_favorite) {
      pdf.setFillColor(
        255,
        92,
        143
      );

      pdf.roundedRect(
        140,
        18,
        50,
        12,
        3,
        3,
        "F"
      );

      pdf.setTextColor(
        255
      );

      pdf.setFontSize(11);

      pdf.text(
        "⭐ Favorite",
        165,
        26,
        {
          align: "center",
        }
      );

      pdf.setTextColor(
        0
      );
    }

    //---------------------------------------
    // Description Box
    //---------------------------------------

    pdf.setDrawColor(
      220
    );

    pdf.roundedRect(
      20,
      y,
      170,
      75,
      4,
      4
    );

    pdf.setFontSize(12);

    const description =
      moment.description ||
      "No description available.";

    const lines =
      pdf.splitTextToSize(
        description,
        155
      );

    pdf.text(
      lines,
      28,
      y + 12
    );

    //---------------------------------------
    // Photo Placeholder
    //---------------------------------------

    y += 95;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(14);

    pdf.text(
      "Memory Photo",
      20,
      y
    );

    pdf.setDrawColor(
      170
    );

    pdf.rect(
      20,
      y + 8,
      120,
      80
    );

    pdf.setFont(
      "helvetica",
      "italic"
    );

    pdf.setFontSize(12);

    //---------------------------------------
// Image
//---------------------------------------

if (moment.image_url) {
  try {
    const image =
      await imageToBase64(
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

  pdf.text(
    "No Image",
    65,
    y + 45
  );
}

    //---------------------------------------
    // Footer
    //---------------------------------------

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(10);

    pdf.setTextColor(
      130
    );

    pdf.text(
      "Created with ❤️ using Momentry",
      105,
      288,
      {
        align: "center",
      }
    );

    pdf.setTextColor(
      0
    );
  });
}