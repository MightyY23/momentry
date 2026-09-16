import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "../../../../services/supabase/supabaseClient";
import {
  getStoryGifts,
  markGiftOpened,
  deleteGift,
} from "../../../../services/gifts/giftService";
import {
  getUpcomingOccasions,
} from "../../../../services/occasions/getUpcomingOccasions";
import useMoments from "../../../../hooks/useMoments";
import useNotification from "../../../../hooks/useNotification";

import GiftComposer from "../GiftComposer/GiftComposer";
import GiftReveal from "../GiftReveal/GiftReveal";

import styles from "./OccasionGifts.module.css";

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(
    `${dateStr}T00:00:00`
  );

  return Math.round(
    (target - today) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Occasions + sealed gifts, unified:
 *  - the celebration banner (countdown)
 *  - "Wrap a gift" composer
 *  - sealed gift cards with live countdown
 *  - full-screen reveal on the day
 * Realtime keeps both partners in sync.
 */
function OccasionGifts() {
  const navigate = useNavigate();

  const { story, addMoment } =
    useMoments();

  const notify = useNotification();

  const [occasions, setOccasions] =
    useState([]);

  const [gifts, setGifts] = useState([]);

  const [senderNames, setSenderNames] =
    useState({});

  const [composerOpen, setComposerOpen] =
    useState(false);

  const [revealingGift, setRevealingGift] =
    useState(null);

  const [unwrapping, setUnwrapping] =
    useState(false);

  const channelRef = useRef(null);

  const storyId = story?.id ?? null;

  //----------------------------------------
  // Load occasions + gifts.
  //----------------------------------------

  const loadGifts = useCallback(async () => {
    if (!storyId) return;

    try {
      const list = await getStoryGifts(
        storyId
      );

      setGifts(list);

      // Resolve sender names for chips.
      const missing = [
        ...new Set(
          list
            .filter((g) => !g.isMine)
            .map((g) => g.senderId)
        ),
      ].filter((id) => !senderNames[id]);

      if (missing.length) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", missing);

        setSenderNames((prev) => ({
          ...prev,
          ...Object.fromEntries(
            (data ?? []).map((p) => [
              p.id,
              p.full_name || "Your partner",
            ])
          ),
        }));
      }
    } catch {
      /* delight feature — never block */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Everything lands after an await — no
      // synchronous setState in the effect body.
      await Promise.resolve();

      if (cancelled) return;

      const list = await getUpcomingOccasions(
        30
      ).catch(() => []);

      if (!cancelled) {
        setOccasions(list ?? []);
      }

      await loadGifts();
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [loadGifts]);

  //----------------------------------------
  // Realtime: sealed boxes pop in instantly.
  //----------------------------------------

  useEffect(() => {
    if (!storyId) return undefined;

    const channel = supabase
      .channel(`gifts-${storyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "occasion_gifts",
          filter: `story_id=eq.${storyId}`,
        },
        () => {
          loadGifts();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId, loadGifts]);

  //----------------------------------------
  // Unwrap → reveal experience.
  //----------------------------------------

  async function handleUnwrap(gift) {
    if (unwrapping) return;

    setUnwrapping(true);

    try {
      await markGiftOpened(gift.id);

      setRevealingGift({
        ...gift,
        isRevealed: true,
      });
    } catch {
      notify.error(
        "Couldn't open the gift",
        "It may not be unlockable yet."
      );
    } finally {
      setUnwrapping(false);
    }
  }

  function handleRevealClosed() {
    setRevealingGift(null);
    loadGifts();
  }

  //----------------------------------------
  // Save the revealed gift as a memory.
  //----------------------------------------

  async function handleSaveAsMemory(gift) {
    const kind =
      gift.occasionKind === "birthday"
        ? "Birthday"
        : "Anniversary";

    const sender =
      senderNames[gift.senderId] ??
      "Your partner";

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await addMoment({
        story_id: storyId,
        created_by: user.id,
        title: `🎁 ${kind} gift from ${sender}`,
        description: gift.message,
        image_url: gift.photoUrl,
        memory_date: new Date()
          .toISOString()
          .slice(0, 10),
        is_favorite: true,
      });

      notify.success(
        "Saved to your story",
        "The gift now lives in your timeline."
      );

      handleRevealClosed();
    } catch {
      notify.error(
        "Couldn't save the memory",
        "Please try again."
      );
    }
  }

  //----------------------------------------
  // Sender deletes an unopened gift.
  //----------------------------------------

  async function handleDelete(gift) {
    if (
      !window.confirm(
        "Unwrap this gift back? The sealed message will be lost."
      )
    ) {
      return;
    }

    try {
      await deleteGift(gift.id);

      notify.success("Gift removed");

      loadGifts();
    } catch {
      notify.error(
        "Couldn't remove the gift"
      );
    }
  }

  //----------------------------------------
  // Derived pieces.
  //----------------------------------------

  const o = occasions[0] ?? null;

  const incoming = gifts.filter(
    (g) => !g.isMine
  );

  const wrapped = gifts.filter(
    (g) => g.isMine
  );

  const emoji =
    o?.kind === "birthday" ? "🎂" : "💕";

  const timing = o
    ? o.isToday
      ? "today!"
      : o.daysUntil === 1
        ? "tomorrow!"
        : `in ${o.daysUntil} days`
    : "";

  const title = o
    ? o.isToday
      ? o.kind === "birthday"
        ? `${o.label} is ${timing}`
        : `Happy ${o.label.toLowerCase()} ${timing}`
      : `${o.label} is ${timing}`
    : "";

  return (
    <>
      {/* Banner appears only the night
          before (or on the day itself) —
          quiet the rest of the year. */}

      {o && o.daysUntil <= 1 && (
        <motion.section
          className={
            o.isToday
              ? `${styles.banner} ${styles.today}`
              : styles.banner
          }
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          aria-label={title}
        >
          <div className={styles.text}>
            <span className={styles.emoji}>
              {emoji}
            </span>

            <div>
              <strong>{title}</strong>

              <span className={styles.sub}>
                Wrap something they'll open on
                the day — sealed until then.
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() =>
                setComposerOpen(true)
              }
            >
              🎁 Wrap a gift
            </button>

            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() =>
                navigate("/storybook")
              }
            >
              📖 StoryBook
            </button>
          </div>
        </motion.section>
      )}

      {/* Sealed / wrapped gifts */}
      {(incoming.length > 0 ||
        wrapped.length > 0) && (
        <div
          className={styles.giftRow}
          aria-label="Occasion gifts"
        >
          <AnimatePresence>
            {incoming.map((gift) => {
              const left = daysUntil(
                gift.openDate
              );

              return (
                <motion.button
                  key={gift.id}
                  type="button"
                  className={
                    left <= 0
                      ? `${styles.giftCard} ${styles.giftOpenable}`
                      : styles.giftCard
                  }
                  onClick={() =>
                    left <= 0
                      ? handleUnwrap(gift)
                      : undefined
                  }
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  aria-label={
                    left <= 0
                      ? "Open your gift"
                      : `Gift unlocks in ${left} days`
                  }
                >
                  <span
                    className={`${styles.boxIcon} ${styles[`box_${gift.boxStyle}`]} ${left <= 0 ? styles.boxShake : ""}`}
                  >
                    🎁
                  </span>

                  <strong>
                    {left <= 0
                      ? "Tap to open!"
                      : `Unlocks in ${left} ${
                          left === 1
                            ? "day"
                            : "days"
                        }`}
                  </strong>

                  <small>
                    {gift.occasionKind ===
                    "birthday"
                      ? "Birthday gift"
                      : "Anniversary gift"}
                  </small>

                  {gift.isRevealed && (
                    <small
                      className={styles.openedTag}
                    >
                      opened ♥
                    </small>
                  )}
                </motion.button>
              );
            })}

            {wrapped.map((gift) => {
              const left = daysUntil(
                gift.openDate
              );

              return (
                <motion.div
                  key={gift.id}
                  className={
                    styles.wrappedChip
                  }
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{ opacity: 0 }}
                >
                  <span>🎀</span>

                  <div>
                    <strong>
                      {gift.occasionKind ===
                      "birthday"
                        ? "Birthday"
                        : "Anniversary"}{" "}
                      gift sealed
                    </strong>

                    <small>
                      {left <= 0
                        ? "unlocked"
                        : `opens in ${left} ${
                            left === 1
                              ? "day"
                              : "days"
                          }`}
                    </small>
                  </div>

                  {!gift.isRevealed && (
                    <button
                      type="button"
                      className={
                        styles.chipDelete
                      }
                      onClick={() =>
                        handleDelete(gift)
                      }
                      aria-label="Remove gift"
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {composerOpen && (
          <GiftComposer
            onClose={() =>
              setComposerOpen(false)
            }
            onWrapped={loadGifts}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealingGift && (
          <GiftReveal
            gift={revealingGift}
            senderName={
              senderNames[
                revealingGift.senderId
              ] ?? "Your partner"
            }
            onClose={handleRevealClosed}
            onSaveAsMemory={
              handleSaveAsMemory
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default OccasionGifts;
