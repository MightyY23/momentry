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
import { uploadImage } from "../../services/storage/uploadImage";
import { deleteImage } from "../../services/storage/uploadImage";

import useMoments from "../../hooks/useMoments";
import useNotification from "../../hooks/useNotification";

function EditMoment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const notify = useNotification();

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

  // Current image URL stored on the row
  // (null = no image).
  const [currentImageUrl, setCurrentImageUrl] =
    useState(null);

  // Newly chosen file not yet uploaded.
  const [newImage, setNewImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  // Set when the user removes the image.
  const [removedImage, setRemovedImage] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  //------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadMoment() {
      try {
        const data =
          await getMoment(id);

        if (cancelled) return;

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

        setCurrentImageUrl(
          data.image_url ?? null
        );
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          notify.error(
            "Couldn't load memory",
            "It may have been deleted."
          );

          navigate("/home");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMoment();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  //------------------------------------
  // Image selection
  //------------------------------------

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setNewImage(file);

    setRemovedImage(false);

    // Preview before upload
    setImagePreview(
      URL.createObjectURL(file)
    );
  }

  function handleRemoveImage() {
    setNewImage(null);

    setImagePreview(null);

    setRemovedImage(true);
  }

  //------------------------------------

  async function handleSave() {
    //----------------------------------
    // Validation — title + date required
    //----------------------------------

    if (!title.trim()) {
      notify.error(
        "Missing title",
        "Please give this memory a title."
      );
      return;
    }

    if (title.trim().length > 120) {
      notify.error(
        "Title too long",
        "Keep the title under 120 characters."
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

    const chosenDate = new Date(memoryDate);

    if (Number.isNaN(chosenDate.getTime())) {
      notify.error(
        "Invalid date",
        "Please pick a valid date."
      );
      return;
    }

    try {
      setSaving(true);

      //----------------------------------
      // Image lifecycle:
      // 1. If a new image was chosen,
      //    upload it FIRST.
      // 2. Only after success, delete the
      //    old file (never before).
      //----------------------------------

      let imageUrl = currentImageUrl;

      if (newImage) {
        setUploading(true);

        const uploadedUrl =
          await uploadImage(newImage);

        setUploading(false);

        // New upload succeeded — safe to
        // clean up the old file.
        if (currentImageUrl) {
          await deleteImage(
            currentImageUrl
          ).catch((err) =>
            console.error(
              "Old image cleanup failed:",
              err
            )
          );
        }

        imageUrl = uploadedUrl;
      } else if (removedImage) {
        // Image removed — delete the file.
        if (currentImageUrl) {
          await deleteImage(
            currentImageUrl
          ).catch((err) =>
            console.error(
              "Old image cleanup failed:",
              err
            )
          );
        }

        imageUrl = null;
      }

      await editMoment(id, {
        title: title.trim(),
        description,
        memory_date: memoryDate,
        location,
        image_url: imageUrl,
      });

      notify.success(
        "Changes saved!",
        "Your memory has been updated."
      );

      navigate(`/moment/${id}`);
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't save changes",
        error.message || "Please try again."
      );
    } finally {
      setSaving(false);

      setUploading(false);
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

  const displayImage =
    imagePreview || currentImageUrl;

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
                <label htmlFor="edit-moment-title">
                  Memory Title *
                </label>

                <input
                  id="edit-moment-title"
                  className={
                    styles.input
                  }
                  value={title}
                  maxLength={120}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                />

                <label htmlFor="edit-moment-date">
                  Memory Date *
                </label>

                <input
                  id="edit-moment-date"
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

                <label htmlFor="edit-moment-location">
                  Location
                </label>

                <input
                  id="edit-moment-location"
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
                <label htmlFor="edit-moment-description">
                  Your Story
                </label>

                <textarea
                  id="edit-moment-description"
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

                {/* ------- Photo ------- */}

                <label>
                  Photo
                </label>

                <div
                  className={
                    styles.imageControls
                  }
                >
                  {displayImage && !removedImage ? (
                    <>
                      <img
                        src={displayImage}
                        alt="Memory photo preview"
                        className={
                          styles.imagePreview
                        }
                        loading="lazy"
                      />

                      <div
                        className={
                          styles.imageButtons
                        }
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            document
                              .getElementById(
                                "edit-moment-photo"
                              )
                              ?.click()
                          }
                        >
                          Replace
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          onClick={
                            handleRemoveImage
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        document
                          .getElementById(
                            "edit-moment-photo"
                          )
                          ?.click()
                      }
                    >
                      📷 Add Photo
                    </Button>
                  )}

                  <input
                    id="edit-moment-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
                    hidden
                    onChange={
                      handleImageChange
                    }
                  />
                </div>

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
                    {uploading
                      ? "Uploading…"
                      : "Save Changes ❤️"}
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
