import { useNavigate } from "react-router-dom";

import styles from "./Welcome.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";
import Heading from "../../ui/Heading/Heading";
import Text from "../../ui/Text/Text";

function Welcome() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/story-introduction");
  };

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <Heading>
            Momentry
          </Heading>

          <Text secondary>
            Because Every Love Story
            <br />
            Deserves a Home.
          </Text>

          <Button onClick={handleStart}>
            Begin Your Story
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default Welcome;