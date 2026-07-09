import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Home.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";

function Home() {
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const storyData = await getMyStory();

        setStory(storyData);

        if (storyData) {
          const momentData = await getMoments(storyData.id);
          setMoments(momentData);
        }
      } catch (error) {
        console.error("Error loading home:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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
        <div className={styles.content}>
          <div className={styles.book}>
            <span className={styles.emoji}>📖</span>

            <h1 className={styles.title}>
              {story?.title ?? "My Story"}
            </h1>

            <p className={styles.date}>
              {story
                ? `Chapter One began on ${new Date(
                    story.created_at
                  ).toLocaleDateString()}`
                : "No story found"}
            </p>
          </div>

          {moments.length === 0 ? (
            <div className={styles.emptyCard}>
              <h2>No moments yet</h2>

              <p>
                Every beautiful story begins
                <br />
                with a single memory.
              </p>

              <Button onClick={() => navigate("/add-moment")}>
                Add Your First Moment
              </Button>
            </div>
          ) : (
            <div className={styles.timeline}>
              <h2>Your Story</h2>

              {moments.map((moment) => (
                <div
                  key={moment.id}
                  className={styles.momentCard}
                >
                  <h3>{moment.title}</h3>

                  <p className={styles.memoryDate}>
                    {new Date(
                      moment.memory_date
                    ).toLocaleDateString()}
                  </p>

                  <p>{moment.description}</p>
                </div>
              ))}

              <Button onClick={() => navigate("/add-moment")}>
                Add Another Moment
              </Button>
            </div>
          )}
        </div>
      </Container>
    </PageLayout>
  );
}

export default Home;