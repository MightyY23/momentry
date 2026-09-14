import useMoments from "../../hooks/useMoments";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";

import Hero from "./components/Hero/Hero";
import StatsGrid from "./components/StatsGrid/StatsGrid";
import MonthlyChart from "./components/MonthlyChart/MonthlyChart";
import JourneyHighlights from "./components/JourneyHighlights/JourneyHighlights";
import RecentMemories from "./components/RecentMemories/RecentMemories";
import TopPlaces from "./components/TopPlaces/TopPlaces";
import MemoryInsights from "./components/MemoryInsights/MemoryInsights";
import JourneyTimeline from "./components/JourneyTimeline/JourneyTimeline";

import styles from "./Analytics.module.css";

function Analytics() {
  //---------------------------------------
  // Global Moments
  //---------------------------------------

  const {
    moments,
    loading,
  } = useMoments();

  //---------------------------------------
  // Loading
  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <div className={styles.container}>
            <div className={styles.skeletonHero} />

            <div className={styles.skeletonGrid}>
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className={styles.skeletonCard}
                  />
                )
              )}
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // Empty
  //---------------------------------------

  if (moments.length === 0) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <div className={styles.container}>
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>
                📊
              </div>

              <h2>
                No data to analyze yet
              </h2>

              <p>
                Add your first memory and this
                page will fill with insights
                about your journey.
              </p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.container}>
          <Hero
            moments={moments}
          />

          <StatsGrid
            moments={moments}
          />

          <div className={styles.twoColumn}>
            <MonthlyChart
              moments={moments}
            />

            <TopPlaces
              moments={moments}
            />
          </div>

          <JourneyHighlights
            moments={moments}
          />

          <RecentMemories
            moments={moments}
          />

          <MemoryInsights
            moments={moments}
          />

          <JourneyTimeline
            moments={moments}
          />
        </div>
      </Container>
    </PageLayout>
  );
}

export default Analytics;
