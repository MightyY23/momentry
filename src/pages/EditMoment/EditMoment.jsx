import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Button from "../../ui/Button/Button";

import styles from "./EditMoment.module.css";

import { getMoment } from "../../services/moment/getMoment";
import { updateMoment } from "../../services/moment/updateMoment";

function EditMoment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMoment() {
      try {
        const data = await getMoment(id);

        setTitle(data.title);
        setDescription(data.description ?? "");
        setMemoryDate(data.memory_date);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadMoment();
  }, [id]);

  async function handleSave() {
    try {
      setSaving(true);

      await updateMoment(id, {
        title,
        description,
        memory_date: memoryDate,
      });

      navigate(`/moment/${id}`);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <h2>Loading...</h2>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        <div className={styles.form}>
          <h1>Edit Moment</h1>

          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className={styles.input}
            type="date"
            value={memoryDate}
            onChange={(e) => setMemoryDate(e.target.value)}
          />

          <div className={styles.buttons}>
            <Button onClick={() => navigate(-1)}>
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}

export default EditMoment;