export async function addTimelinePages(
  pdf,
  moments = []
) {
  //---------------------------------------
  // Sort by Date
  //---------------------------------------

  const timeline = [...moments].sort(
    (a, b) =>
      new Date(a.memory_date) -
      new Date(b.memory_date)
  );

  //---------------------------------------

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(24);

  pdf.text(
    "Our Journey",
    105,
    20,
    {
      align: "center",
    }
  );

  //---------------------------------------

  let y = 40;

  timeline.forEach((moment) => {
    //---------------------------------------
    // New Page
    //---------------------------------------

    if (y > 260) {
      pdf.addPage();

      pdf.setFontSize(24);

      pdf.text(
        "Our Journey",
        105,
        20,
        {
          align: "center",
        }
      );

      y = 40;
    }

    //---------------------------------------
    // Timeline Line
    //---------------------------------------

    pdf.setDrawColor(
      210,
      210,
      210
    );

    pdf.line(
      35,
      y,
      35,
      y + 18
    );

    //---------------------------------------
    // Circle
    //---------------------------------------

    pdf.setFillColor(
      255,
      92,
      143
    );

    pdf.circle(
      35,
      y,
      2,
      "F"
    );

    //---------------------------------------
    // Date
    //---------------------------------------

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(11);

    pdf.text(
      new Date(
        moment.memory_date
      ).toLocaleDateString(),
      45,
      y + 2
    );

    //---------------------------------------
    // Title
    //---------------------------------------

    pdf.setFontSize(15);

    pdf.text(
      moment.title ||
        "Untitled Memory",
      45,
      y + 10
    );

    //---------------------------------------
    // Location
    //---------------------------------------

    if (moment.location) {
      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(11);

      pdf.text(
        `📍 ${moment.location}`,
        45,
        y + 18
      );
    }

    //---------------------------------------
    // Description
    //---------------------------------------

    if (moment.description) {
      const lines =
        pdf.splitTextToSize(
          moment.description,
          135
        );

      pdf.setFontSize(10);

      pdf.text(
        lines.slice(0, 3),
        45,
        y + 28
      );

      y +=
        Math.min(
          lines.length,
          3
        ) * 5;
    }

    //---------------------------------------

    y += 38;
  });

  //---------------------------------------

  pdf.setFontSize(10);

  pdf.setTextColor(
    120
  );

  pdf.text(
    "Every journey begins with a single memory ❤️",
    105,
    285,
    {
      align: "center",
    }
  );

  pdf.setTextColor(
    0
  );
}