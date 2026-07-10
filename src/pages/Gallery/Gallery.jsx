import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";

import Navbar from "../../components/Navbar/Navbar";
import SearchBar from "../../components/SearchBar/SearchBar";

import styles from "./Gallery.module.css";

import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";

function Gallery() {
  const navigate = useNavigate();

  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadGallery() {
      try {
        const story = await getMyStory();

        if (!story) {
          setMoments([]);
          return;
        }

        const data = await getMoments(story.id);
        setMoments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadGallery();
  }, []);

  // Search Filter
  const filteredMoments = moments.filter((moment) => {
    const query = search.toLowerCase();

    return (
      moment.title?.toLowerCase().includes(query) ||
      moment.description?.toLowerCase().includes(query) ||
      new Date(moment.memory_date)
        .toLocaleDateString()
        .includes(query)
    );
  });

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />
          <h2>Loading Gallery...</h2>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <motion.h1
          className={styles.heading}
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          📸 Gallery
        </motion.h1>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="🔍 Search your gallery..."
        />

        {filteredMoments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              marginTop: "60px",
            }}
          >
            <h2>No memories found 🔍</h2>

            <p>
              Try searching with a different title,
              description or date.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredMoments.map((moment, index) => (
              <motion.div
                key={moment.id}
                className={styles.card}
                onClick={() =>
                  navigate(`/moment/${moment.id}`)
                }
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.05,
                }}
                whileHover={{
                  scale: 1.02,
                  y: -6,
                }}
              >
                <img
                  src={moment.image_url}
                  alt={moment.title}
                  className={styles.image}
                />

                <div className={styles.overlay}>
                  <h3>{moment.title}</h3>

                  <p>
                    {new Date(
                      moment.memory_date
                    ).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </PageLayout>
  );
}

export default Gallery;