import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Home.module.css";

import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import { supabase } from "../../services/supabase/supabaseClient";
import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";
import { toggleFavorite } from "../../services/moment/toggleFavorite";

import Navbar from "../../components/Navbar/Navbar";
import SearchBar from "../../components/SearchBar/SearchBar";
import StoryHeader from "../../components/StoryHeader/StoryHeader";
import EmptyState from "../../components/EmptyState/EmptyState";
import Timeline from "../../components/Timeline/Timeline";

function Home() {
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);

  async function loadData() {
    try {
      const storyData = await getMyStory();

      setStory(storyData);

      if (storyData) {
        const momentData = await getMoments(storyData.id);
        setMoments(momentData);
      } else {
        setMoments([]);
      }
    } catch (error) {
      console.error("Error loading home:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite(moment) {
    try {
      await toggleFavorite(
        moment.id,
        moment.is_favorite
      );

      setMoments((prev) =>
        prev.map((item) =>
          item.id === moment.id
            ? {
                ...item,
                is_favorite: !item.is_favorite,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Unable to update favorite.");
    }
  }

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("moments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "moments",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredMoments = moments.filter((moment) => {
    const query = search.toLowerCase();

    const matchesSearch =
      moment.title?.toLowerCase().includes(query) ||
      moment.description?.toLowerCase().includes(query) ||
      new Date(moment.memory_date)
        .toLocaleDateString()
        .includes(query);

    const matchesFavorite =
      !showFavorites || moment.is_favorite;

    return matchesSearch && matchesFavorite;
  });

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <h2>Loading your story...</h2>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="🔍 Search your memories..."
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "25px",
          }}
        >
          <button
            onClick={() => setShowFavorites(false)}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              background: !showFavorites
                ? "#ff5c8d"
                : "#eee",
              color: !showFavorites
                ? "white"
                : "#333",
            }}
          >
            All Memories
          </button>

          <button
            onClick={() => setShowFavorites(true)}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              background: showFavorites
                ? "#ff5c8d"
                : "#eee",
              color: showFavorites
                ? "white"
                : "#333",
            }}
          >
            ❤️ Favorites
          </button>
        </div>

        <div className={styles.content}>
          <StoryHeader story={story} />

          {filteredMoments.length === 0 ? (
            search || showFavorites ? (
              <EmptyState
                onAddMoment={() => {
                  setSearch("");
                  setShowFavorites(false);
                }}
              />
            ) : (
              <EmptyState
                onAddMoment={() =>
                  navigate("/add-moment")
                }
              />
            )
          ) : (
            <Timeline
              moments={filteredMoments}
              onOpenMoment={(id) =>
                navigate(`/moment/${id}`)
              }
              onAddMoment={() =>
                navigate("/add-moment")
              }
              onToggleFavorite={
                handleToggleFavorite
              }
            />
          )}
        </div>
      </Container>
    </PageLayout>
  );
}

export default Home;