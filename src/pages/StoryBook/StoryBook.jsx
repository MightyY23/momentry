import { useMemo, useState } from "react";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";
import Navbar from "../../components/Navbar/Navbar";
import ConfirmDialog from "../../ui/ConfirmDialog/ConfirmDialog";

import AnimatedBackground from "../../components/Background/AnimatedBackground";
import ExportPDFButton from "../../components/ExportPDFButton/ExportPDFButton";

import { getAchievements } from "../../services/achievement/achievementEngine";

import BookCover from "./components/BookCover";
import BookReader from "./components/BookReader";
import ReadingStats from "./components/ReadingStats";

import styles from "./StoryBook.module.css";

import useMoments from "../../hooks/useMoments";
import useAIStory from "../../hooks/useAIStory";
import useNotification from "../../hooks/useNotification";

import { startStoryGeneration } from "../../services/ai/getStory";
import { deleteAIStory } from "../../services/ai/deleteAIStory";

function StoryBook() {
  //---------------------------------------
  // Global Data
  //---------------------------------------

  const { story, moments, loading } =
    useMoments();

  const {
    aiStory,
    loading: aiLoading,
    generating,
    refetch,
  } = useAIStory(story?.id);

  const notify = useNotification();

  //---------------------------------------
  // Local State
  //---------------------------------------

  const [opened, setOpened] = useState(false);

  const [starting, setStarting] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [confirmRegenerate,
    setConfirmRegenerate] =
    useState(false);

  const [confirmDeleteAI,
    setConfirmDeleteAI] =
    useState(false);

  const [deletingAI, setDeletingAI] =
    useState(false);

  //---------------------------------------
  // Parse AI Story
  //---------------------------------------

  const storyData = useMemo(() => {
    if (!aiStory?.content) return null;

    try {
      const parsed =
        typeof aiStory.content === "string"
          ? JSON.parse(aiStory.content)
          : aiStory.content;

      if (
        !parsed ||
        !Array.isArray(parsed.chapters) ||
        parsed.chapters.length === 0
      ) {
        return null;
      }

      return parsed;
    } catch (err) {
      console.error(
        "Failed to parse AI story:",
        err
      );

      return null;
    }
  }, [aiStory]);

  //---------------------------------------
  // Generate handler
  //---------------------------------------

  async function handleGenerate() {
    if (!story?.id) return;

    if (moments.length === 0) {
      notify.error(
        "Add memories first",
        "Your StoryBook needs at least one memory to write about."
      );
      return;
    }

    try {
      setStarting(true);

      await startStoryGeneration(
        story.id
      );

      notify.success(
        "Writing your StoryBook…",
        "This usually takes under a minute."
      );

      refetch();
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't start generation",
        err.message ||
          "Please try again in a moment."
      );
    } finally {
      setStarting(false);
    }
  }

  //---------------------------------------
  // Delete AI story (keeps the sample
  // book so the reader still works)
  //---------------------------------------

  async function handleDeleteAI() {
    try {
      setDeletingAI(true);

      await deleteAIStory(story.id);

      setConfirmDeleteAI(false);

      notify.success(
        "AI story deleted",
        "You can generate a fresh one anytime."
      );

      refetch();
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't delete AI story",
        err.message || "Please try again."
      );
    } finally {
      setDeletingAI(false);
    }
  }

  //---------------------------------------
  // PDF export
  //---------------------------------------

  async function handleExportPDF() {
    if (!story) return;

    if (moments.length === 0) {
      notify.error(
        "Nothing to export",
        "Add some memories first."
      );
      return;
    }

    try {
      setExporting(true);

      const { generateMemoryBook } =
        await import(
          "../../services/pdf/generateMemoryBook"
        );

      const { achievements } =
        getAchievements(moments);

      await generateMemoryBook({
        story: {
          ...story,
          title:
            storyData?.title ||
            story.title,
        },
        moments,
        achievements,
      });

      notify.success(
        "Memory book exported!",
        "Your PDF has been downloaded."
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't export PDF",
        err.message ||
          "Please try again in a moment."
      );
    } finally {
      setExporting(false);
    }
  }

  //---------------------------------------
  // Loading
  //---------------------------------------

  if (loading || aiLoading) {
    return (
      <PageLayout>
        <AnimatedBackground />

        <Container>
          <Navbar />

          <div className={styles.centerState}>
            <div className={styles.spinner} />

            <h2>Opening your StoryBook…</h2>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // No story at all
  //---------------------------------------

  if (!story) {
    return (
      <PageLayout>
        <AnimatedBackground />

        <Container>
          <Navbar />

          <div className={styles.centerState}>
            <h2>No story yet</h2>

            <p>
              Create your story to begin your
              StoryBook.
            </p>

            <Button onClick={() => setOpened(false)}>
              Go Home
            </Button>
          </div>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------
  // Final book (AI or demo fallback)
  //---------------------------------------

  const demoBook = {
    title: story?.title || "Our Story",

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

  const isSample = !storyData;

  const displayBook = storyData || demoBook;

  const chapters = Array.isArray(
    displayBook?.chapters
  )
    ? displayBook.chapters
    : [];

  //---------------------------------------
  // UI
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
            Every memory deserves its own
            chapter.
          </p>

          {generating && (
            <div
              className={styles.generateBanner}
            >
              <div
                className={styles.bannerSpinner}
              />

              <div>
                <strong>
                  ✨ Writing your StoryBook…
                </strong>

                <span>
                  Our AI is turning your
                  memories into chapters.
                  This page will update
                  automatically.
                </span>
              </div>
            </div>
          )}

          {aiStory?.status === "failed" && (
            <div
              className={styles.failedBanner}
            >
              <div>
                <strong>
                  Generation failed.
                </strong>

                <span>
                  {aiStory.error_message ||
                    "Something went wrong while writing your book."}
                </span>
              </div>

              <Button
                size="sm"
                onClick={handleGenerate}
                loading={starting}
              >
                Retry
              </Button>
            </div>
          )}

          {!opened ? (
            <>
              {isSample && !generating && (
                <div
                  className={
                    styles.sampleBanner
                  }
                >
                  <div>
                    <strong>
                      This is a sample book.
                    </strong>

                    <span>
                      {moments.length === 0
                        ? "Add some memories first, then generate your real StoryBook with AI."
                        : "Generate your real StoryBook to turn your memories into chapters."}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={
                      handleGenerate
                    }
                    loading={starting}
                    leftIcon="✨"
                  >
                    {moments.length === 0
                      ? "Add Memories First"
                      : "Generate with AI"}
                  </Button>
                </div>
              )}

              <BookCover
                story={{
                  ...story,
                  title:
                    storyData?.title ||
                    story.title,
                }}
                moments={moments}
                onOpen={() =>
                  setOpened(true)
                }
              />

              <div
                className={
                  styles.exportRow
                }
              >
                {!isSample && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setConfirmRegenerate(
                          true
                        )
                      }
                      loading={
                        starting
                      }
                    >
                      ✨ Regenerate
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setConfirmDeleteAI(
                          true
                        )
                      }
                    >
                      🗑 Delete AI Story
                    </Button>
                  </>
                )}

                <ExportPDFButton
                  onExport={
                    handleExportPDF
                  }
                />

                {exporting && (
                  <span
                    className={
                      styles.exportingLabel
                    }
                  >
                    Preparing your PDF…
                  </span>
                )}
              </div>
            </>
          ) : chapters.length === 0 ? (
            <div
              className={styles.centerState}
            >
              <h2>
                No chapters available
              </h2>

              <Button
                onClick={() =>
                  setOpened(false)
                }
              >
                Back to Cover
              </Button>
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
                  storyId: story.id,
                }}
                onClose={() =>
                  setOpened(false)
                }
              />
            </>
          )}
        </div>
      </Container>

      <ConfirmDialog
        open={confirmRegenerate}
        title="Regenerate your StoryBook?"
        message="The current AI-written book will be replaced with a fresh one based on your memories. This cannot be undone."
        confirmLabel="Regenerate"
        cancelLabel="Keep Current"
        loading={starting}
        onConfirm={() => {
          setConfirmRegenerate(false);

          handleGenerate();
        }}
        onCancel={() =>
          setConfirmRegenerate(false)
        }
      />

      <ConfirmDialog
        open={confirmDeleteAI}
        title="Delete the AI story?"
        message="Your generated chapters will be removed. Your memories are safe — you can generate a new book anytime."
        confirmLabel="Delete AI Story"
        cancelLabel="Keep it"
        danger
        loading={deletingAI}
        onConfirm={
          handleDeleteAI
        }
        onCancel={() =>
          setConfirmDeleteAI(false)
        }
      />
    </PageLayout>
  );
}

export default StoryBook;
