import { useNavigate } from "react-router-dom";

import styles from "./StoryIntro.module.css";

import Button from "../../components/Button/Button";
import Container from "../../components/Container/Container";
import PageLayout from "../../components/PageLayout/PageLayout";

function StoryIntro() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <h1 className={styles.heading}>
            Every great love story
            <br />
            begins with a
            <br />
            single moment.
          </h1>

          <p className={styles.body}>
            The first text.
            <br />
            The first laugh.
            <br />
            The first photo.
            <br />
            <br />
            The little memories that quietly
            become your favorite ones.
            <br />
            <br />
            Momentry gives those moments
            a home.
          </p>

          <Button
            onClick={() => navigate("/create-story")}
          >
            Continue
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default StoryIntro;