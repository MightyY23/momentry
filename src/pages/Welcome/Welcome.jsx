import { useNavigate } from "react-router-dom";

import styles from "./Welcome.module.css";

import Button from "../../components/Button/Button";
import Container from "../../components/Container/Container";
import PageLayout from "../../components/PageLayout/PageLayout";

function Welcome() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/story-introduction");
  };

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <h1 className={styles.logo}>
            Momentry
          </h1>

          <p className={styles.tagline}>
            Because Every Love Story
            <br />
            Deserves a Home.
          </p>

          <Button onClick={handleStart}>
            Begin Your Story
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default Welcome;