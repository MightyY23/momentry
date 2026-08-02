import jsPDF from "jspdf";

import { addCoverPage } from "./addCoverPage";
import { addStatsPage } from "./addStatsPage";
import { addTimelinePages } from "./addTimelinePages";
import { addMemoryPages } from "./addMemoryPages";
import { addAchievementsPage } from "./addAchievementsPage";
import { addClosingPage } from "./addClosingPage";

export async function generateMemoryBook({
  story,
  moments,
  achievements,
}) {
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

  pdf.addPage();

  await addStatsPage(pdf, moments);

  //---------------------------------------

  pdf.addPage();

  await addTimelinePages(
    pdf,
    moments
  );

  //---------------------------------------

  await addMemoryPages(
    pdf,
    moments
  );

  //---------------------------------------

  pdf.addPage();

  await addAchievementsPage(
    pdf,
    achievements
  );

  await addClosingPage(pdf);
  //---------------------------------------

  pdf.save("Momentry.pdf");
}