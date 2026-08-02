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

          <h2>
            Loading Analytics...
          </h2>
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

          <MonthlyChart
            moments={moments}
          />

          <JourneyHighlights
            moments={moments}
          />

          <RecentMemories
            moments={moments}
          />

          <TopPlaces
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