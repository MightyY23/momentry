import { useEffect, useState } from "react";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";

import GlobalSearch from "../../components/GlobalSearch/GlobalSearch";

import styles from "./Search.module.css";

import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";

function Search() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMemories() {
      try {
        const story = await getMyStory();

        if (!story) {
          setMoments([]);
          return;
        }

        const data = await getMoments(story.id);

        setMoments(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMemories();
  }, []);

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.container}>
          <h1 className={styles.heading}>
            🔍 Global Search
          </h1>

          <p className={styles.subtitle}>
            Search all your memories instantly.
          </p>

          {loading ? (
            <p>Loading memories...</p>
          ) : (
            <GlobalSearch moments={moments} />
          )}
        </div>
      </Container>
    </PageLayout>
  );
}

export default Search;