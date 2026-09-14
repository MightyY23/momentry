import { useNavigate } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";

import styles from "./NotFound.module.css";

function NotFound() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <h1 className={styles.code}>
            404
          </h1>

          <h2 className={styles.title}>
            This page isn't part of
            <br />
            your story.
          </h2>

          <p className={styles.text}>
            The page you're looking for was
            moved, removed, or never
            existed.
          </p>

          <Button onClick={() => navigate("/")}>
            Back to the Beginning
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default NotFound;
