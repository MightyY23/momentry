import {
  useEffect,
  useRef,
  useState,
} from "react";

import { motion } from "framer-motion";

import Button from "../../../../ui/Button/Button";
import ConfirmDialog from "../../../../ui/ConfirmDialog/ConfirmDialog";

import {
  getGalleryMedia,
  addGalleryMedia,
  deleteGalleryMedia,
} from "../../../../services/photo/mediaService";

import useMoments from "../../../../hooks/useMoments";

import useNotification from "../../../../hooks/useNotification";

import styles from "./GalleryPhotos.module.css";

/**
 * The wall — photos AND videos that don't
 * need a date or a title. Any member can
 * add; own media (or the owner) removes.
 */
function GalleryPhotos() {
  const notify = useNotification();

  const { story } = useMoments();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState("");

  const [selected, setSelected] = useState(null);

  const [confirmDelete, setConfirmDelete] =
    useState(null);

  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef(null);

  //---------------------------------------
  // Load
  //---------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await getGalleryMedia();

        if (!cancelled) {
          setItems(rows);
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
  // Upload (photos + videos, many at once)
  //---------------------------------------

  async function handleFiles(e) {
    const files = [
      ...(e.target.files || []),
    ];

    e.target.value = "";

    if (!files.length) return;

    try {
      setUploading(true);

      const created = [];

      for (let i = 0; i < files.length; i++) {
        const name = files[i].name;

        setUploadProgress(
          `Uploading ${i + 1} of ${files.length}… ${name.slice(0, 18)}`
        );

        const rows = await addGalleryMedia([
          files[i],
        ]);

        created.push(...rows);
      }

      setItems((prev) => [
        ...created,
        ...prev,
      ]);

      notify.success(
        "Added to your wall",
        `${created.length} item${
          created.length === 1 ? "" : "s"
        } uploaded.`
      );
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't upload",
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

      await deleteGalleryMedia(
        confirmDelete
      );

      setItems((prev) =>
        prev.filter(
          (p) => p.id !== confirmDelete.id
        )
      );

      setSelected(null);
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't remove",
        error.message || "Please try again."
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  //---------------------------------------
  // Lightbox keyboard + swipe
  //---------------------------------------

  useEffect(() => {
    if (selected === null) return undefined;

    function onKey(e) {
      if (e.key === "Escape") {
        setSelected(null);
      }

      if (e.key === "ArrowRight") {
        setSelected((i) =>
          i === null ? null : (i + 1) % items.length
        );
      }

      if (e.key === "ArrowLeft") {
        setSelected((i) =>
          i === null
            ? null
            : (i - 1 + items.length) %
              items.length
        );
      }
    }

    window.addEventListener(
      "keydown",
      onKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKey
      );
  }, [selected, items.length]);

  const touchX = useRef(null);

  function onTouchStart(e) {
    touchX.current =
      e.touches?.[0]?.clientX ?? null;
  }

  function onTouchEnd(e) {
    if (touchX.current == null) return;

    const dx =
      (e.changedTouches?.[0]?.clientX ??
        0) - touchX.current;

    touchX.current = null;

    if (Math.abs(dx) < 50) return;

    setSelected((i) =>
      i === null
        ? null
        : dx < 0
        ? (i + 1) % items.length
        : (i - 1 + items.length) %
          items.length
    );
  }

  if (!story) {
    return null;
  }

  const currentItem =
    selected !== null ? items[selected] : null;

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
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={uploading}
        >
          {uploading
            ? uploadProgress || "Uploading…"
            : "+ Add photos & videos"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
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
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          Photos and videos without a memory
          live here — screenshots, clips, the
          whole messy beautiful pile.
        </p>
      ) : (
        <div className={styles.grid}>
          {items.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              className={styles.cell}
              onClick={() =>
                setSelected(index)
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              aria-label={
                item.media_type === "video"
                  ? "Open video"
                  : "Open photo"
              }
            >
              {item.media_type ===
              "video" ? (
                <>
                  <video
                    src={item.image_url}
                    muted
                    playsInline
                    preload="metadata"
                    className={styles.image}
                  />

                  <span
                    className={styles.playBadge}
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                </>
              ) : (
                <img
                  src={item.image_url}
                  alt=""
                  loading="lazy"
                  className={styles.image}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {currentItem && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            ✕
          </button>

          {currentItem.media_type ===
          "video" ? (
            <video
              src={currentItem.image_url}
              controls
              autoPlay
              playsInline
              className={styles.lightboxMedia}
              onClick={(e) =>
                e.stopPropagation()
              }
            />
          ) : (
            <img
              src={currentItem.image_url}
              alt=""
              className={styles.lightboxMedia}
              onClick={(e) =>
                e.stopPropagation()
              }
            />
          )}

          <div
            className={styles.lightboxBar}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <span
              className={styles.lightboxCount}
            >
              {selected + 1} / {items.length}
            </span>

            <div
              className={
                styles.lightboxActions
              }
            >
              <Button
                variant="secondary"
                onClick={() =>
                  setSelected(
                    (i) =>
                      (i - 1 + items.length) %
                      items.length
                  )
                }
                aria-label="Previous"
              >
                ←
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  setSelected(
                    (i) =>
                      (i + 1) % items.length
                  )
                }
                aria-label="Next"
              >
                →
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  setConfirmDelete(
                    currentItem
                  )
                }
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove this item?"
        message="It will disappear from the wall for both of you. This can't be undone."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() =>
          setConfirmDelete(null)
        }
      />
    </section>
  );
}

export default GalleryPhotos;
