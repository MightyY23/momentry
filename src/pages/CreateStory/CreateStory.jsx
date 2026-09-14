import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./CreateStory.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import { createStory } from "../../services/story/storyService";
import useNotification from "../../hooks/useNotification";

function CreateStory() {
  const navigate = useNavigate();

  const notify = useNotification();

  const [storyName, setStoryName] = useState("Our Story");
  const [loading, setLoading] = useState(false);

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
        </div>
      </Container>
    </PageLayout>
  );
}

export default CreateStory;