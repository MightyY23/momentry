import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import styles from "./GiftReveal.module.css";

const BOX_GRADIENTS = {
  rose: "linear-gradient(150deg,#ff5c8d,#c74272)",
  gold: "linear-gradient(150deg,#d4af37,#9a7b1e)",
  midnight: "linear-gradient(150deg,#2b2b45,#14141f)",
  bloom: "linear-gradient(150deg,#ffb7c5,#ff8fab)",
};

/**
 * Full-screen unwrap experience:
 * sealed box → shake → burst of confetti →
 * message + photo reveal → save as memory.
 */
function GiftReveal({
  gift,
  senderName,
  onClose,
  onSaveAsMemory,
}) {
  const [phase, setPhase] = useState(
    "shaking" // shaking → burst → revealed
  );

  const [saving, setSaving] = useState(false);

  //----------------------------------------
  // Shake for a moment, then burst open.
  //----------------------------------------

  useEffect(() => {
    const timer = setTimeout(
      () => setPhase("burst"),
      1600
    );

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "burst") return undefined;

    const timer = setTimeout(
      () => setPhase("revealed"),
      900
    );

    return () => clearTimeout(timer);
  }, [phase]);

  //----------------------------------------
  // Confetti pieces (deterministic per mount).
  //----------------------------------------

  const confetti = Array.from(
    { length: 36 },
    (_, i) => ({
      id: i,
      left: (i * 97) % 100,
      delay: ((i * 13) % 10) / 10,
      duration: 2.4 + ((i * 7) % 10) / 10,
      color: [
        "#ff5c8d",
        "#ffd166",
        "#8ecae6",
        "#c77dff",
        "#ffb7c5",
      ][i % 5],
      size: 6 + ((i * 5) % 8),
    })
  );

  const gradient =
    BOX_GRADIENTS[gift?.boxStyle] ??
    BOX_GRADIENTS.rose;

  function handleSave() {
    setSaving(true);
    onSaveAsMemory?.(gift);
  }

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Your gift"
    >
      {/* Confetti during burst + reveal */}
      {phase !== "shaking" &&
        confetti.map((c) => (
          <motion.span
            key={c.id}
            className={styles.confetti}
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 1.4,
              background: c.color,
            }}
            initial={{ y: -40, opacity: 1, rotate: 0 }}
            animate={{
              y: "110vh",
              opacity: [1, 1, 0.9, 0],
              rotate: 540,
            }}
            transition={{
              duration: c.duration,
              delay: c.delay,
              ease: "easeIn",
            }}
          />
        ))}

      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      {phase === "shaking" && (
        <motion.div
          className={styles.stage}
          aria-live="polite"
        >
          <motion.span
            className={styles.bigBox}
            style={{ background: gradient }}
            animate={{
              rotate: [0, -6, 6, -5, 5, -3, 3, 0],
              scale: [1, 1.04, 1, 1.06, 1, 1.08, 1],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
            }}
          >
            🎁
          </motion.span>

          <p className={styles.stageText}>
            Something's inside…
          </p>
        </motion.div>
      )}

      {phase === "burst" && (
        <motion.div
          className={styles.stage}
        >
          <motion.span
            className={styles.bigBox}
            style={{ background: gradient }}
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.5, 0.001],
              rotate: [0, 12, -20],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.85,
              ease: "easeOut",
            }}
          >
            🎁
          </motion.span>
        </motion.div>
      )}

      {phase === "revealed" && (
        <motion.div
          className={styles.reveal}
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className={styles.fromLine}>
            For you, from {senderName}
          </span>

          {gift.photoUrl && (
            <img
              className={styles.photo}
              src={gift.photoUrl}
              alt="Gift photo"
              loading="lazy"
            />
          )}

          {gift.message && (
            <p className={styles.message}>
              {gift.message}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : "💾 Save as a memory"}
            </button>

            <button
              type="button"
              className={styles.laterBtn}
              onClick={onClose}
            >
              Keep it here
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default GiftReveal;
