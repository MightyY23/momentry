import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Home.module.css";

import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";
import Button from "../../ui/Button/Button";

import useMoments from "../../hooks/useMoments";

import Navbar from "../../components/Navbar/Navbar";
import SearchBar from "../../components/SearchBar/SearchBar";
import StoryHeader from "../../components/StoryHeader/StoryHeader";
import EmptyState from "../../components/EmptyState/EmptyState";
import Timeline from "../../components/Timeline/Timeline";

import HeroSection from "./components/HeroSection/HeroSection";
import StatsGrid from "./components/StatsGrid/StatsGrid";
import RecentMemories from "./components/RecentMemories/RecentMemories";
import QuickActions from "./components/QuickActions/QuickActions";
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

      alert(
        "Unable to update favorite."
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

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div
            className={styles.loading}
          >
            <h2>
              Loading your story...
            </h2>
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
          />

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search memories..."
          />

          <StatsGrid
            moments={moments}
            anniversaryDate={
              anniversaryDate
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

          <div className={styles.filters}>

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
              📖 All Memories
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

          <div
            className={
              styles.timelineSection
            }
          >

            <StoryHeader
              story={story}
            />

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

        </div>

      </Container>
    </PageLayout>
  );
}

export default Home;