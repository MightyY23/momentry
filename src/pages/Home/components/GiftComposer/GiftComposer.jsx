import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  createGift,
  validateGift,
} from "../../../../services/gifts/giftService";
import {
  validateImageFile,
} from "../../../../services/storage/uploadImage";
import useMoments from "../../../../hooks/useMoments";
import useNotification from "../../../../hooks/useNotification";
import {
  getUpcomingOccasions,
} from "../../../../services/occasions/getUpcomingOccasions";

import styles from "./GiftComposer.module.css";

const BOX_STYLES = [
  { id: "rose", emoji: "🎁", label: "Rose" },
  { id: "gold", emoji: "🎀", label: "Gold" },
  { id: "midnight", emoji: "🖤", label: "Midnight" },
  { id: "bloom", emoji: "🌸", label: "Bloom" },
];

function GiftComposer({ onClose, onWrapped }) {
  const { story } = useMoments();

  const notify = useNotification();

  const [step, setStep] = useState(1);

  const [occasions, setOccasions] =
    useState([]);

  const [occasion, setOccasion] =
    useState(null);

  const [boxStyle, setBoxStyle] =
    useState("rose");

  const [message, setMessage] =
    useState("");

  const [photoFile, setPhotoFile] =
    useState(null);

  const [photoPreview, setPhotoPreview] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState(null);

  const messageRef = useRef(null);

  //----------------------------------------
  // Load the upcoming occasions to wrap for.
  //----------------------------------------

  useEffect(() => {
    let cancelled = false;

    getUpcomingOccasions(45)
      .then((list) => {
        if (cancelled) return;

        setOccasions(list ?? []);

        if (list?.length) {
          setOccasion(list[0]);
        }
      })
      .catch(() => {
        /* Banner wouldn't have opened
           without occasions. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-open date = the occasion's next date.
  const openDate = occasion
    ? occasion.date.slice(0, 10)
    : "";

  //----------------------------------------
  // Photo selection with validation.
  //----------------------------------------

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const validationError =
      validateImageFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setPhotoFile(file);
    setPhotoPreview(
      URL.createObjectURL(file)
    );
  }

  function clearPhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(null);
    setPhotoPreview(null);
  }

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  //----------------------------------------
  // Seal it.
  //----------------------------------------

  async function handleSeal() {
    const validationError = validateGift({
      message,
      openDate,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createGift({
        storyId: story?.id,
        recipientId: occasion.userId,
        occasionKind: occasion.kind,
        openDate,
        boxStyle,
        message,
        photoFile,
      });

      notify.success(
        "Gift sealed 🎁",
        `It unlocks ${
          occasion.isToday
            ? "today"
            : `on ${openDate}`
        }.`
      );

      onWrapped?.();
      onClose();
    } catch (err) {
      setError(
        err.message ||
          "Couldn't seal the gift."
      );
      setSubmitting(false);
    }
  }

  //----------------------------------------
  // Steps: 1 occasion → 2 box → 3 message.
  //----------------------------------------

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Wrap a gift"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <h2>Wrap a gift</h2>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className={styles.steps}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={
                step === n
                  ? styles.stepDotActive
                  : styles.stepDot
              }
            />
          ))}
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className={styles.body}>
            <p className={styles.hint}>
              Who is this gift for?
            </p>

            {occasions.length === 0 && (
              <p className={styles.emptyNote}>
                No upcoming occasions — add a
                birthday in your profile first.
              </p>
            )}

            <div className={styles.occasionList}>
              {occasions.map((o, i) => (
                <button
                  key={`${o.kind}-${i}`}
                  type="button"
                  className={
                    occasion === o
                      ? styles.occasionActive
                      : styles.occasionBtn
                  }
                  onClick={() => {
                    setOccasion(o);
                    setError(null);
                  }}
                >
                  <span className={styles.occEmoji}>
                    {o.kind === "birthday"
                      ? "🎂"
                      : "💕"}
                  </span>

                  <span>
                    <strong>{o.label}</strong>

                    <small>
                      {o.isToday
                        ? "today"
                        : `in ${o.daysUntil} days`}
                    </small>
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!occasion}
              onClick={() => setStep(2)}
            >
              Choose the box →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.body}>
            <p className={styles.hint}>
              Pick a wrapping style.
            </p>

            <div className={styles.boxGrid}>
              {BOX_STYLES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={
                    boxStyle === b.id
                      ? `${styles.boxBtn} ${styles.boxBtnActive} ${styles[`box_${b.id}`]}`
                      : `${styles.boxBtn} ${styles[`box_${b.id}`]}`
                  }
                  onClick={() =>
                    setBoxStyle(b.id)
                  }
                  aria-label={`${b.label} box`}
                >
                  <span>{b.emoji}</span>

                  <small>{b.label}</small>
                </button>
              ))}
            </div>

            <div className={styles.row}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setStep(3)}
              >
                Write the note →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.body}>
            <p className={styles.hint}>
              Your message stays sealed until{" "}
              <strong>{openDate}</strong>.
            </p>

            <textarea
              ref={messageRef}
              className={styles.textarea}
              value={message}
              placeholder="Write something they'll never forget…"
              onChange={(e) =>
                setMessage(e.target.value)
              }
              rows={5}
            />

            <span className={styles.counter}>
              {message.length}/2000
            </span>

            {photoPreview ? (
              <div className={styles.photoPreview}>
                <img
                  src={photoPreview}
                  alt="Gift photo preview"
                />

                <button
                  type="button"
                  onClick={clearPhoto}
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className={styles.photoLabel}>
                📷 Attach a photo (optional)

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  hidden
                />
              </label>
            )}

            <div className={styles.row}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setStep(2)}
                disabled={submitting}
              >
                ← Back
              </button>

              <button
                type="button"
                className={styles.sealBtn}
                onClick={handleSeal}
                disabled={
                  submitting ||
                  !message.trim()
                }
              >
                {submitting
                  ? "Sealing…"
                  : "🎁 Seal the gift"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default GiftComposer;
