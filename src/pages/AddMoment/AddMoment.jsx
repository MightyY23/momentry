import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./AddMoment.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import { createMoment } from "../../services/moment/momentService";
import { getMyStory } from "../../services/story/getStory";
import { supabase } from "../../services/supabase/supabaseClient";

import { uploadImage } from "../../services/storage/uploadImage";

function AddMoment() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  async function handleSave() {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (!memoryDate) {
      alert("Please select a date.");
      return;
    }

    try {
      setLoading(true);

      const story = await getMyStory();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let imageUrl = "";
      
      if (image) {
        imageUrl = await uploadImage(image);
        }

      await createMoment({
        story_id: story.id,
        title,
        description,
        memory_date: memoryDate,
        created_by: user.id,
        image_url: imageUrl,
      });

      navigate("/home");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <Container>
        <div className={styles.content}>
          <h1 className={styles.heading}>
            ✨ Add Your First Moment
          </h1>

          <input
            className={styles.input}
            placeholder="Moment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className={styles.textarea}
            placeholder="Tell the story..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className={styles.input}
            type="date"
            value={memoryDate}
            onChange={(e) => setMemoryDate(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />

          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Moment"}
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
}

export default AddMoment;