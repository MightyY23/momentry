import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Home.module.css";

import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import useMoments from "../../hooks/useMoments";
import useNotification from "../../hooks/useNotification";

import Navbar from "../../components/Navbar/Navbar";
import StoryHeader from "../../components/StoryHeader/StoryHeader";
import EmptyState from "../../components/EmptyState/EmptyState";
import Timeline from "../../components/Timeline/Timeline";

import HeroSection from "./components/HeroSection/HeroSection";
import OccasionGifts from "./components/OccasionGifts/OccasionGifts";
import StatsGrid from "./components/StatsGrid/StatsGrid";
import RecentMemories from "./components/RecentMemories/RecentMemories";
import QuickActions from "./components/QuickActions/QuickActions";
import OnThisDay from "./components/OnThisDay/OnThisDay";
import AnniversaryCard from "./components/AnniversaryCard/AnniversaryCard";
import DashboardFeed from "./components/DashboardFeed/DashboardFeed";

function Home() {
  const navigate = useNavigate();

  const {
    story,
    moments,
    loading,
    favoriteMoment,
  } = useMoments();

  const notify = useNotification();

  const timelineRef = useRef(null);

  function jumpToTimeline() {
    timelineRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const [search, setSearch] =
    useState("");

  const [showFavorites, setShowFavorites] =
    useState(false);

  //----------------------------------------
  // Toggle Favorite
  //----------------------------------------

  async function handleToggleFavorite(
    moment
  ) {
    try {
      await favoriteMoment(
        moment.id
      );
    } catch (error) {
      console.error(error);

      notify.error(
        "Unable to update favorite",
        "Please try again."
      );
    }
  }

  //----------------------------------------
  // Anniversary Date
  //----------------------------------------

  const anniversaryDate =
    useMemo(() => {
      if (!moments.length)
        return null;

      return [...moments].sort(
        (a, b) =>
          new Date(
            a.memory_date
          ) -
          new Date(
            b.memory_date
          )
      )[0].memory_date;
    }, [moments]);

  //----------------------------------------
  // Filter Memories
  //----------------------------------------

  const filteredMoments =
    useMemo(() => {
      const query =
        search.toLowerCase();

      return moments.filter(
        (moment) => {
          const matchesSearch =
            moment.title
              ?.toLowerCase()
              .includes(query) ||
            moment.description
              ?.toLowerCase()
              .includes(query) ||
            moment.location
              ?.toLowerCase()
              .includes(query) ||
            new Date(
              moment.memory_date
            )
              .toLocaleDateString()
              .includes(query);

          const matchesFavorite =
            !showFavorites ||
            moment.is_favorite;

          return (
            matchesSearch &&
            matchesFavorite
          );
        }
      );
    }, [
      moments,
      search,
      showFavorites,
    ]);

  //----------------------------------------
  // Skeleton loading
  //----------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <div className={styles.pageContent}>
            <div className={styles.skeletonHero} />

            <div className={styles.skeletonStats}>
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className={styles.skeletonCard}
                  />
                )
              )}
            </div>

            <div className={styles.skeletonTimeline}>
              {Array.from({ length: 3 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className={styles.skeletonRow}
                  />
                )
              )}
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //----------------------------------------

  return (
    <PageLayout>
      <Container>

        <Navbar />


        <div
          className={
            styles.pageContent
          }
        >

          <HeroSection
            story={story}
            anniversaryDate={
              anniversaryDate
            }
            memoriesCount={
              moments.length
            }
            onJumpToTimeline={
              jumpToTimeline
            }
          />

          <StatsGrid
            moments={moments}
            anniversaryDate={
              anniversaryDate
            }
          />

          <OnThisDay
            moments={moments}
            onOpenMoment={(id) =>
              navigate(`/moment/${id}`)
            }
          />

          <div
            className={
              styles.dashboardGrid
            }
          >

            <div
              className={
                styles.mainColumn
              }
            >

              <RecentMemories
                moments={moments}
              />

            </div>

            <div
              className={
                styles.sideColumn
              }
            >

              <QuickActions />

              <AnniversaryCard
                anniversaryDate={
                  anniversaryDate
                }
              />

            </div>

          </div>

          <div
            ref={timelineRef}
            className={
              styles.timelineSection
            }
          >

            <div
              className={styles.sectionHead}
            >
              <StoryHeader
                story={story}
              />

              <div
                className={styles.filters}
              >
                <div
                  className={
                    styles.toolbarSearch
                  }
                >
                  <input
                    type="search"
                    value={search}
                    placeholder="Search memories…"
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />

                  {search && (
                    <button
                      className={
                        styles.clearButton
                      }
                      onClick={() =>
                        setSearch("")
                      }
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div
                  className={
                    styles.filterPills
                  }
                >
                  <button
                    className={
                      !showFavorites
                        ? styles.filterActive
                        : styles.filterButton
                    }
                    onClick={() =>
                      setShowFavorites(false)
                    }
                  >
                    📖 All
                  </button>

                  <button
                    className={
                      showFavorites
                        ? styles.filterActive
                        : styles.filterButton
                    }
                    onClick={() =>
                      setShowFavorites(true)
                    }
                  >
                    ❤️ Favorites
                  </button>
                </div>
              </div>
            </div>

            {filteredMoments.length ===
            0 ? (
              search ||
              showFavorites ? (
                <EmptyState
                  onAddMoment={() => {
                    setSearch("");

                    setShowFavorites(
                      false
                    );
                  }}
                />
              ) : (
                <EmptyState
                  onAddMoment={() =>
                    navigate(
                      "/add-moment"
                    )
                  }
                />
              )
            ) : (
              <Timeline
                moments={
                  filteredMoments
                }
                onOpenMoment={(
                  id
                ) =>
                  navigate(
                    `/moment/${id}`
                  )
                }
                onAddMoment={() =>
                  navigate(
                    "/add-moment"
                  )
                }
                onToggleFavorite={
                  handleToggleFavorite
                }
              />
            )}

          </div>

          <DashboardFeed
            moments={moments}
          />

          {/* Occasions + sealed gifts live at
              the bottom — celebratory, not in
              the way of daily use. */}

          <OccasionGifts />

        </div>

      </Container>
    </PageLayout>
  );
}

export default Home;
