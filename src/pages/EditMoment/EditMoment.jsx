import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import styles from "./EditMoment.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import { getMoment } from "../../services/moment/getMoment";

import useMoments from "../../hooks/useMoments";

function EditMoment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { editMoment } =
    useMoments();

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [memoryDate, setMemoryDate] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  //------------------------------------

  useEffect(() => {
    async function loadMoment() {
      try {
        const data =
          await getMoment(id);

        setTitle(data.title);

        setDescription(
          data.description ?? ""
        );

        setMemoryDate(
          data.memory_date
        );

        setLocation(
          data.location ?? ""
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadMoment();
  }, [id]);

  //------------------------------------

  async function handleSave() {
    try {
      setSaving(true);

      await editMoment(id, {
        title,
        description,
        memory_date: memoryDate,
        location,
      });

      navigate(`/moment/${id}`);
    } catch (error) {
      console.error(error);

      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  //------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <h2>
            Loading Memory...
          </h2>
        </Container>
      </PageLayout>
    );
  }

  //------------------------------------

  return (
    <PageLayout>
      <Container>
        <motion.div
          className={styles.page}
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div className={styles.header}>
            <span className={styles.badge}>
              ✏️ Edit Memory
            </span>

            <h1>
              Update Your Memory
            </h1>

            <p>
              Improve your story,
              add details and keep
              your memories alive.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.grid}>
              <div className={styles.left}>
                <label>
                  Memory Title
                </label>

                <input
                  className={
                    styles.input
                  }
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                />

                <label>
                  Memory Date
                </label>

                <input
                  className={
                    styles.input
                  }
                  type="date"
                  value={memoryDate}
                  onChange={(e) =>
                    setMemoryDate(
                      e.target.value
                    )
                  }
                />

                <label>
                  Location
                </label>

                <input
                  className={
                    styles.input
                  }
                  value={location}
                  placeholder="📍 Location"
                  onChange={(e) =>
                    setLocation(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className={styles.right}>
                <label>
                  Your Story
                </label>

                <textarea
                  className={
                    styles.textarea
                  }
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                />

                <div
                  className={
                    styles.footer
                  }
                >
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(-1)
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    loading={
                      saving
                    }
                    onClick={
                      handleSave
                    }
                  >
                    Save Changes ❤️
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </PageLayout>
  );
}

export default EditMoment;