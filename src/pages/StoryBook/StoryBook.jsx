import { useEffect, useState } from "react";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";

import AnimatedBackground from "../../components/Background/AnimatedBackground";

import BookCover from "./components/BookCover";
import BookReader from "./components/BookReader";
import ReadingStats from "./components/ReadingStats";

import styles from "./StoryBook.module.css";

import useMoments from "../../hooks/useMoments";

import { getAIStory } from "../../services/ai/getStory";

function StoryBook() {
  //---------------------------------------
  // Global Data
  //---------------------------------------

  const {
    story,
    moments,
    loading,
  } = useMoments();

  //---------------------------------------
  // Local State
  //---------------------------------------

  const [book, setBook] =
    useState(null);

  const [opened, setOpened] =
    useState(false);

  const [aiLoading, setAiLoading] =
    useState(true);

  //---------------------------------------
  // Load AI Story
  //---------------------------------------

  useEffect(() => {
    async function loadAI() {
      if (!story) {
        setAiLoading(false);
        return;
      }

      try {
        const aiStory =
          await getAIStory(
            story.id
          );

        if (aiStory) {
          setBook(aiStory);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAiLoading(false);
      }
    }

    loadAI();
  }, [story]);

  //---------------------------------------
  // Loading
  //---------------------------------------

  if (loading || aiLoading) {
    return (
      <PageLayout>
        <AnimatedBackground />

        <Container>
          <Navbar />

          <h2>Loading StoryBook...</h2>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // Parse AI Story
  //---------------------------------------

  let storyData = null;

  if (book?.content) {
    try {
      storyData =
        typeof book.content === "string"
          ? JSON.parse(book.content)
          : book.content;
    } catch (err) {
      console.error(
        "Failed to parse AI story:",
        err
      );
    }
  }

  //---------------------------------------
  // Demo Story
  //---------------------------------------

  const demoBook = {
    title:
      story?.title ||
      "Our Story",

    summary:
      "A collection of beautiful memories written into a timeless love story.",

    chapters: [
      {
        title: "Chapter One",
        content:
          "Every story begins with a single moment. A glance, a smile, a conversation that quietly changes everything.",
      },
      {
        title: "Chapter Two",
        content:
          "As days turned into weeks and months, every memory became another page in our story.",
      },
      {
        title: "Chapter Three",
        content:
          "Looking back, we realized that the smallest moments became our greatest treasures.",
      },
    ],
  };

  //---------------------------------------
  // Final Book
  //---------------------------------------

  const displayBook =
    storyData || demoBook;

  //---------------------------------------
  // Safety Check
  //---------------------------------------

  const chapters =
    Array.isArray(
      displayBook?.chapters
    )
      ? displayBook.chapters
      : [];

  //---------------------------------------

  return (
    <PageLayout>
      <AnimatedBackground />

      <Container>
        <Navbar />

        <div className={styles.container}>
          <h1 className={styles.heading}>
            📖 StoryBook
          </h1>

          <p className={styles.subtitle}>
            Every memory deserves its own chapter.
          </p>

          {!opened ? (
            <BookCover
              story={story}
              moments={moments}
              onOpen={() => {
                console.log(
                  "Opening StoryBook..."
                );
                setOpened(true);
              }}
            />
          ) : chapters.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
              }}
            >
              <h2>
                No chapters available
              </h2>

              <button
                onClick={() =>
                  setOpened(false)
                }
              >
                Back
              </button>
            </div>
          ) : (
            <>
              <ReadingStats
                chapters={
                  chapters.length
                }
                memories={
                  moments.length
                }
                createdAt={
                  story?.created_at
                }
              />

              <BookReader
                book={{
                  ...displayBook,
                  chapters,
                }}
                onClose={() =>
                  setOpened(false)
                }
              />
            </>
          )}
        </div>
      </Container>
    </PageLayout>
  );
}

export default StoryBook;