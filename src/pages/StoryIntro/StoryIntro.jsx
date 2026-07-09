import { useNavigate } from "react-router-dom";

import styles from "./StoryIntro.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";
import Heading from "../../ui/Heading/Heading";
import Text from "../../ui/Text/Text";

function StoryIntro() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <Heading>
            Every great love story
            <br />
            begins with a
            <br />
            single moment.
          </Heading>

          <Text secondary>
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
          </Text>

          <Button
            onClick={() => navigate("/auth")}
          >
            Continue
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default StoryIntro;