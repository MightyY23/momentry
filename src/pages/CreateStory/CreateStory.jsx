import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./CreateStory.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import { createStory } from "../../services/story/storyService";
import { pairWithCode } from "../../services/pairing/pairing";
import {
  applyPendingAnniversary,
} from "../../services/story/applyPendingAnniversary";
import useNotification from "../../hooks/useNotification";

function CreateStory() {
  const navigate = useNavigate();

  const notify = useNotification();

  const [storyName, setStoryName] = useState("Our Story");
  const [loading, setLoading] = useState(false);

  //---------------------------------------
  // Partner-code pairing (skip story
  // creation and join your partner's)
  //---------------------------------------

  const [pairCode, setPairCode] = useState("");

  const [pairLoading, setPairLoading] = useState(false);

  async function handlePair() {
    const code = pairCode.trim().toUpperCase();

    if (code.length < 6) {
      notify.error(
        "Code too short",
        "Partner codes are 6 characters."
      );
      return;
    }

    try {
      setPairLoading(true);

      await pairWithCode(code);

      // Apply the anniversary collected in
      // onboarding now that a story exists.
      if (await applyPendingAnniversary()) {
        notify.success(
          "You're paired! 💞",
          "Your anniversary is saved too."
        );
      } else {
        notify.success(
          "You're paired! 💞",
          "Welcome to your shared story."
        );
      }

      navigate("/home", { replace: true });
    } catch (error) {
      notify.error(
        "Couldn't pair",
        error.message || "Please try again."
      );
    } finally {
      setPairLoading(false);
    }
  }

  async function handleContinue() {
    if (!storyName.trim()) {
      notify.error(
        "Missing title",
        "Please enter a story title."
      );
      return;
    }

    try {
      setLoading(true);

      const story = await createStory(storyName.trim());

      // Apply the anniversary collected in
      // onboarding now that the story exists.
      if (await applyPendingAnniversary()) {
        notify.success(
          "Story created! 💞",
          "Your anniversary is saved."
        );
      }

        navigate("/invite-partner", {
        state: {
            storyId: story.id,
        },
        });
    } catch (error) {
      console.error(error);
      notify.error(
        "Unable to create story",
        error.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <h1 className={styles.heading}>
            What should the cover
            <br />
            of your storybook say?
          </h1>

          <p className={styles.body}>
            This title will appear every time
            <br />
            you open your story.
          </p>

          <input
            className={styles.input}
            type="text"
            value={storyName}
            onChange={(e) => setStoryName(e.target.value)}
            placeholder="Our Story"
          />

          <Button
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? "Creating Story..." : "Continue"}
          </Button>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <p className={styles.pairHint}>
            Your partner already made a story? Join
            it with the code they shared with you.
          </p>

          <div className={styles.pairRow}>
            <input
              className={`${styles.input} ${styles.pairInput}`}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="ABC123"
              value={pairCode}
              onChange={(e) =>
                setPairCode(e.target.value.toUpperCase())
              }
            />

            <Button
              variant="secondary"
              onClick={handlePair}
              disabled={
                pairLoading ||
                pairCode.trim().length < 6
              }
            >
              {pairLoading ? "Pairing…" : "Pair up"}
            </Button>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}

export default CreateStory;