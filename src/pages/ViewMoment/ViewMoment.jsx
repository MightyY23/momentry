import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";

import styles from "./ViewMoment.module.css";

import { getMoment } from "../../services/moment/getMoment";

function ViewMoment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [moment, setMoment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMoment() {
      try {
        const data = await getMoment(id);
        setMoment(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadMoment();
  }, [id]);

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <h2>Loading moment...</h2>
        </Container>
      </PageLayout>
    );
  }

  if (!moment) {
    return (
      <PageLayout>
        <Container>
          <h2>Moment not found.</h2>

          <Button onClick={() => navigate("/home")}>
            Back to Home
          </Button>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        <div className={styles.card}>
          {moment.image_url && (
            <img
              src={moment.image_url}
              alt={moment.title}
              className={styles.image}
            />
          )}

          <h1>{moment.title}</h1>

          <p className={styles.date}>
            📅{" "}
            {new Date(moment.memory_date).toLocaleDateString()}
          </p>

          <p className={styles.description}>
            {moment.description}
          </p>

          <div className={styles.actions}>
            <Button onClick={() => navigate("/home")}>
              Back
            </Button>

            <Button
              onClick={() =>
                navigate(`/edit-moment/${moment.id}`)
              }
            >
              Edit
            </Button>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}

export default ViewMoment;