export async function addClosingPage(
  pdf
) {
  pdf.addPage();

  //---------------------------------------

  pdf.setFillColor(
    255,
    245,
    248
  );

  pdf.rect(
    0,
    0,
    210,
    297,
    "F"
  );

  //---------------------------------------

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(30);

  pdf.text(
    "❤️",
    105,
    70,
    {
      align: "center",
    }
  );

  pdf.setFontSize(24);

  pdf.text(
    "Thank You",
    105,
    95,
    {
      align: "center",
    }
  );

  pdf.setFont(
    "times",
    "italic"
  );

  pdf.setFontSize(18);

  pdf.text(
    "Every ending is simply",
    105,
    140,
    {
      align: "center",
    }
  );

  pdf.text(
    "the beginning of another memory.",
    105,
    152,
    {
      align: "center",
    }
  );

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(12);

  pdf.text(
    "Created with ❤️ using Momentry",
    105,
    280,
    {
      align: "center",
    }
  );
}