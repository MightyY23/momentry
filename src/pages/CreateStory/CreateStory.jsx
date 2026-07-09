import { useState } from "react";

import styles from "./CreateStory.module.css";

import Button from "../../components/Button/Button";
import Container from "../../components/Container/Container";
import PageLayout from "../../components/PageLayout/PageLayout";

function CreateStory() {
  const [storyName, setStoryName] = useState("Our Story");

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>

          <h1 className={styles.heading}>
            What should we call
            <br />
            your story?
          </h1>

          <p className={styles.body}>
            Choose a name that feels special.
            <br />
            You can always change it later.
          </p>

          <input
            className={styles.input}
            type="text"
            value={storyName}
            onChange={(e) => setStoryName(e.target.value)}
          />

          <Button>
            Continue
          </Button>

        </div>
      </Container>
    </PageLayout>
  );
}

export default CreateStory;