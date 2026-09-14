import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";

import Navbar from "../../components/Navbar/Navbar";
import SearchBar from "../../components/SearchBar/SearchBar";

import styles from "./Gallery.module.css";

import GalleryCard from "./components/GalleryCard";
import GalleryLightbox from "./components/GalleryLightbox";
import GalleryFilters from "./components/GalleryFilters";
import GalleryStats from "./components/GalleryStats/GalleryStats";

import useMoments from "../../hooks/useMoments";

function Gallery() {
  const navigate = useNavigate();

  //---------------------------------------
  // Global
  //---------------------------------------

  const {
    moments,
    loading,
  } = useMoments();

  //---------------------------------------

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const [selectedIndex, setSelectedIndex] =
    useState(null);

  //---------------------------------------
  // Available years (newest first)
  //---------------------------------------

  const years = useMemo(() => {
    const set = new Set(
      moments.map(
        (m) =>
          new Date(
            m.memory_date
          ).getFullYear()
      )
    );

    return [...set].sort(
      (a, b) => b - a
    );
  }, [moments]);

  //---------------------------------------
  // Filter
  //---------------------------------------

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

          let matchesFilter;

          switch (filter) {
            case "favorites":
              matchesFilter =
                moment.is_favorite;
              break;

            case "year":
              matchesFilter =
                new Date(
                  moment.memory_date
                ).getFullYear() === year;
              break;

            case "photos":
              matchesFilter =
                Boolean(
                  moment.image_url
                );
              break;

            case "location":
              matchesFilter =
                Boolean(
                  moment.location
                );
              break;

            default:
              matchesFilter = true;
          }

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      moments,
      search,
      filter,
      year,
    ]);

  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <h2>
            Loading Gallery...
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

        <motion.section
          className={styles.hero}
          initial={{
            opacity: 0,
            y: -30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div>
            <span
              className={
                styles.badge
              }
            >
              📸 OUR GALLERY
            </span>

            <h1>
              Every Memory,
              Forever.
            </h1>

            <p>
              Browse every
              picture, milestone,
              trip and special
              moment you've shared
              together.
            </p>
          </div>

          <div
            className={
              styles.count
            }
          >
            <h2>
              {
                filteredMoments.length
              }
            </h2>

            <span>
              Memories
            </span>
          </div>
        </motion.section>

        <GalleryStats
          moments={moments}
        />

        <div
          className={
            styles.controls
          }
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search memories..."
          />

          <GalleryFilters
            filter={filter}
            setFilter={setFilter}
            year={year}
            setYear={setYear}
            years={years}
          />
        </div>

        {filteredMoments.length ===
        0 ? (
          <motion.div
            className={
              styles.empty
            }
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
          >
            <div
              className={
                styles.emptyEmoji
              }
            >
              📷
            </div>

            <h2>
              No Memories Found
            </h2>

            <p>
              Try another search
              or filter.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              className={
                styles.grid
              }
            >
              {filteredMoments.map(
                (
                  moment,
                  index
                ) => (
                  <GalleryCard
                    key={
                      moment.id
                    }
                    moment={
                      moment
                    }
                    onClick={() =>
                      setSelectedIndex(
                        index
                      )
                    }
                  />
                )
              )}
            </motion.div>

            {selectedIndex !==
              null && (
              <GalleryLightbox
                moments={
                  filteredMoments
                }
                index={
                  selectedIndex
                }
                onClose={() =>
                  setSelectedIndex(
                    null
                  )
                }
                onPrev={() =>
                  setSelectedIndex(
                    (
                      prev
                    ) =>
                      prev === 0
                        ? filteredMoments.length -
                          1
                        : prev - 1
                  )
                }
                onNext={() =>
                  setSelectedIndex(
                    (
                      prev
                    ) =>
                      prev ===
                      filteredMoments.length -
                        1
                        ? 0
                        : prev + 1
                  )
                }
                onOpenMoment={(
                  id
                ) => {
                  setSelectedIndex(
                    null
                  );

                  navigate(
                    `/moment/${id}`
                  );
                }}
              />
            )}
          </>
        )}
      </Container>
    </PageLayout>
  );
}

export default Gallery;