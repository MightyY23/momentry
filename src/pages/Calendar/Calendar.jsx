import { useState } from "react";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";

import CalendarHeader from "./components/CalendarHeader/CalendarHeader";
import CalendarFilters from "./components/CalendarFilters/CalendarFilters";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import DayDrawer from "./components/DayDrawer/DayDrawer";
import MonthTimeline from "./components/MonthTimeline/MonthTimeline";

import styles from "./Calendar.module.css";

import useMoments from "../../hooks/useMoments";

function Calendar() {
  //---------------------------------------
  // Global Moments
  //---------------------------------------

  const {
    moments,
    loading,
  } = useMoments();

  //---------------------------------------
  // Local State
  //---------------------------------------

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [selectedDate, setSelectedDate] =
    useState(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [favoritesOnly, setFavoritesOnly] =
    useState(false);

  const [photosOnly, setPhotosOnly] =
    useState(false);

  //---------------------------------------
  // Loading
  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <div className={styles.container}>
            <h2>Loading calendar...</h2>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // Filter Memories
  //---------------------------------------

  const filteredMoments = moments.filter(
    (moment) => {
      const matchesSearch =
        !search ||
        moment.title
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        moment.description
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        moment.location
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesFavorite =
        !favoritesOnly ||
        moment.is_favorite;

      const matchesPhoto =
        !photosOnly ||
        moment.image_url;

      return (
        matchesSearch &&
        matchesFavorite &&
        matchesPhoto
      );
    }
  );

  //---------------------------------------

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.container}>
          <CalendarHeader
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            moments={filteredMoments}
          />

          <CalendarFilters
            search={search}
            setSearch={setSearch}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={
              setFavoritesOnly
            }
            photosOnly={photosOnly}
            setPhotosOnly={
              setPhotosOnly
            }
          />

          <CalendarGrid
            currentDate={currentDate}
            moments={filteredMoments}
            selectedDate={selectedDate}
            setSelectedDate={
              setSelectedDate
            }
            drawerOpen={drawerOpen}
            setDrawerOpen={
              setDrawerOpen
            }
          />

          <DayDrawer
            open={drawerOpen}
            onClose={() =>
              setDrawerOpen(false)
            }
            selectedDate={selectedDate}
            moments={filteredMoments}
          />

          <MonthTimeline
            currentDate={currentDate}
            moments={filteredMoments}
          />
        </div>
      </Container>
    </PageLayout>
  );
}

export default Calendar;