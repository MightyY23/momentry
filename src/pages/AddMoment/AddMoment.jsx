import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import styles from "./AddMoment.module.css";

import Button from "../../ui/Button/Button";
import Container from "../../ui/Container/Container";
import PageLayout from "../../ui/PageLayout/PageLayout";

import { getMyStory } from "../../services/story/getStory";
import { supabase } from "../../services/supabase/supabaseClient";
import { uploadImage } from "../../services/storage/uploadImage";

import useMoments from "../../hooks/useMoments";
import useNotification from "../../hooks/useNotification";

import { celebrate } from "../../utils/celebrate";

import LocationPicker from "../../components/LocationPicker/LocationPicker";
import CaptureMemory from "../../components/CaptureMemory/CaptureMemory";

function AddMoment() {
  const navigate = useNavigate();

  const { addMoment } = useMoments();

  const notify = useNotification();

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [memoryDate, setMemoryDate] =
    useState("");
  const [location, setLocation] =
    useState("");

  const [lat, setLat] = useState(null);

  const [lng, setLng] = useState(null);

  const [captureOpen, setCaptureOpen] =
    useState(false);
  const [image, setImage] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  //-------------------------------------

  async function handleSave() {
    if (!title.trim()) {
      notify.error(
        "Missing title",
        "Please give this memory a title."
      );
      return;
    }

    if (!memoryDate) {
      notify.error(
        "Missing date",
        "Please choose when this memory happened."
      );
      return;
    }

    try {
      setLoading(true);

      const story =
        await getMyStory();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      let imageUrl = "";

      if (image) {
        imageUrl =
          await uploadImage(image);
      }

      await addMoment({
        story_id: story.id,
        title,
        description,
        memory_date: memoryDate,
        location,
        latitude: lat,
        longitude: lng,
        created_by: user.id,
        image_url: imageUrl,
      });

      celebrate();

      navigate("/home");
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't save memory",
        error.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  //-------------------------------------

  return (
    <PageLayout>
      <Container>
        <motion.div
          className={styles.page}
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div className={styles.header}>
            <span className={styles.badge}>
              ✨ New Chapter
            </span>

            <h1>
              Create a Beautiful Memory
            </h1>

            <p>
              Every moment tells a story.
              Capture yours forever.
            </p>

            <Button
              variant="secondary"
              onClick={() =>
                setCaptureOpen(true)
              }
            >
              📸 Capture now
            </Button>
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
                  placeholder="Our First Date"
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

                <LocationPicker
                  value={
                    location
                      ? {
                          label: location,
                          lat: lat,
                          lng: lng,
                        }
                      : null
                  }
                  onChange={(picked) => {
                    setLocation(
                      picked?.label ?? ""
                    );

                    setLat(
                      picked?.lat ?? null
                    );

                    setLng(
                      picked?.lng ?? null
                    );
                  }}
                />

                <label>
                  Upload Photo
                </label>

                <label
                  className={
                    styles.upload
                  }
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) =>
                      setImage(
                        e.target
                          .files[0]
                      )
                    }
                  />

                  {image ? (
                    <>
                      <img
                        src={URL.createObjectURL(
                          image
                        )}
                        alt=""
                      />

                      <span>
                        Change Photo
                      </span>
                    </>
                  ) : (
                    <>
                      <div>
                        📸
                      </div>

                      <span>
                        Click to Upload
                      </span>
                    </>
                  )}
                </label>
              </div>

              <div className={styles.right}>
                <label>
                  Your Story
                </label>

                <textarea
                  className={
                    styles.textarea
                  }
                  placeholder="Tell your beautiful story..."
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
                      navigate(
                        "/home"
                      )
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={
                      handleSave
                    }
                    loading={
                      loading
                    }
                  >
                    Save Memory ❤️
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>

      <CaptureMemory
        open={captureOpen}
        onClose={(draft) => {
          setCaptureOpen(false);

          if (!draft) return;

          setImage(draft.file);

          if (draft.suggestedTitle) {
            setTitle(draft.suggestedTitle);
          }

          if (draft.memoryDate) {
            setMemoryDate(draft.memoryDate);
          }

          if (draft.placeLabel) {
            setLocation(draft.placeLabel);
          }

          if (draft.coords) {
            setLat(draft.coords.lat);
            setLng(draft.coords.lng);
          }
        }}
      />
    </PageLayout>
  );
}

export default AddMoment;