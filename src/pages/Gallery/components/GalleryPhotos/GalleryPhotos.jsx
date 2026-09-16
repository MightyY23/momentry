import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

import Button from "../../../../ui/Button/Button";
import ConfirmDialog from "../../../../ui/ConfirmDialog/ConfirmDialog";

import {
  getGalleryPhotos,
  addGalleryPhotos,
  deleteGalleryPhoto,
} from "../../../../services/photo/galleryPhotoService";

import useMoments from "../../../../hooks/useMoments";

import useNotification from "../../../../hooks/useNotification";

import styles from "./GalleryPhotos.module.css";

/**
 * Photos without memories — a shared wall
 * where any member can drop pictures that
 * don't need a date or a title.
 */
function GalleryPhotos() {
  const notify = useNotification();

  const { story } = useMoments();

  const [photos, setPhotos] = useState([]);

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] =
    useState("");

  const [selected, setSelected] = useState(null);

  const [confirmDelete, setConfirmDelete] =
    useState(null);

  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef(null);

  //---------------------------------------
  // Load + realtime
  //---------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await getGalleryPhotos();

        if (!cancelled) {
          setPhotos(rows);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  //---------------------------------------
  // Upload
  //---------------------------------------

  async function handleFiles(e) {
    const files = [...(e.target.files || [])];

    e.target.value = "";

    if (!files.length) return;

    try {
      setUploading(true);

      const created = [];

      for (
        let i = 0;
        i < files.length;
        i++
      ) {
        setUploadProgress(
          `Uploading ${i + 1} of ${files.length}…`
        );

        const rows = await addGalleryPhotos([
          files[i],
        ]);

        created.push(...rows);
      }

      setPhotos((prev) => [...created, ...prev]);

      notify.success(
        "Photos added",
        `${created.length} photo${
          created.length === 1 ? "" : "s"
        } now on your wall.`
      );
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't add photos",
        error.message || "Please try again."
      );
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  }

  //---------------------------------------
  // Delete
  //---------------------------------------

  async function handleDelete() {
    if (!confirmDelete) return;

    try {
      setDeleting(true);

      await deleteGalleryPhoto(confirmDelete);

      setPhotos((prev) =>
        prev.filter(
          (p) => p.id !== confirmDelete.id
        )
      );

      setSelected(null);
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't remove photo",
        error.message || "Please try again."
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  if (!story) {
    return null;
  }

  return (
    <section
      className={styles.section}
      aria-label="Photo wall"
    >
      <div className={styles.header}>
        <h2 className={styles.title}>
          🖼️ Photo Wall
        </h2>

        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading
            ? uploadProgress || "Uploading…"
            : "+ Add photos"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>

      {loading ? (
        <div className={styles.skeletonRow}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={styles.skeleton}
            />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <p className={styles.empty}>
          Photos without a memory live here —
          screenshots, random shots, the whole
          messy beautiful pile.
        </p>
      ) : (
        <div className={styles.grid}>
          {photos.map((photo, index) => (
            <motion.button
              key={photo.id}
              type="button"
              className={styles.cell}
              onClick={() =>
                setSelected(index)
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              loading="lazy"
              aria-label="Open photo"
            >
              <img
                src={photo.image_url}
                alt=""
                loading="lazy"
                className={styles.image}
              />
            </motion.button>
          ))}
        </div>
      )}

      {selected !== null &&
        photos[selected] && (
          <div
            className={styles.lightbox}
            role="dialog"
            aria-modal="true"
            onClick={() => setSelected(null)}
          >
            <img
              src={photos[selected].image_url}
              alt=""
              className={styles.lightboxImage}
              onClick={(e) =>
                e.stopPropagation()
              }
            />

            <div
              className={styles.lightboxBar}
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <Button
                variant="secondary"
                onClick={() =>
                  setSelected(null)
                }
              >
                Close
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  setConfirmDelete(
                    photos[selected]
                  )
                }
              >
                Delete
              </Button>
            </div>
          </div>
        )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove this photo?"
        message="It will disappear from the photo wall for both of you. This can't be undone."
        confirmLabel="Delete photo"
        cancelLabel="Keep it"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </section>
  );
}

export default GalleryPhotos;
