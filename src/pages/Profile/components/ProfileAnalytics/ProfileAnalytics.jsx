import useMoments from "../../../../hooks/useMoments";

import Achievements from "../Achievements/Achievements";

import StatsGrid from "../../../Analytics/components/StatsGrid/StatsGrid";
import MonthlyChart from "../../../Analytics/components/MonthlyChart/MonthlyChart";
import TopPlaces from "../../../Analytics/components/TopPlaces/TopPlaces";
import JourneyHighlights from "../../../Analytics/components/JourneyHighlights/JourneyHighlights";
import MemoryInsights from "../../../Analytics/components/MemoryInsights/MemoryInsights";

import styles from "./ProfileAnalytics.module.css";

/**
 * The Analytics experience, embedded
 * directly in the Profile page:
 * Achievements first, then the charts.
 */
function ProfileAnalytics() {
  const { moments } = useMoments();

  if (moments.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.section}
      aria-label="Memory analytics"
    >
      <header className={styles.header}>
        <span className={styles.kicker}>
          📊 Insights
        </span>

        <h2>Memory Analytics</h2>

        <p>
          Patterns and milestones from
          everything you've captured.
        </p>
      </header>

      <Achievements moments={moments} />

      <StatsGrid moments={moments} />

      <div className={styles.twoColumn}>
        <MonthlyChart moments={moments} />

        <TopPlaces moments={moments} />
      </div>

      <JourneyHighlights
        moments={moments}
      />

      <MemoryInsights moments={moments} />
    </section>
  );
}

export default ProfileAnalytics;
