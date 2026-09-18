import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  ImagePlus,
  Mic,
  Phone,
  Send,
  X,
} from "lucide-react";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";
import Loader from "../../ui/Loader/Loader";
import Button from "../../ui/Button/Button";

import PartnerProfileModal from "../../components/PartnerProfileModal/PartnerProfileModal";

import CallOverlay from "../../components/CallOverlay/CallOverlay";

import { useAuth } from "../../contexts/useAuth";

import useMoments from "../../hooks/useMoments";
import useNotification from "../../hooks/useNotification";

import { getMyStory } from "../../services/story/getStory";
import { getStoryMembers } from "../../services/story/members";
import {
  getChatMessages,
  sendChatMessage,
  subscribeToChat,
  setReaction,
  markThreadSeen,
  sendVoiceNote,
  subscribeToTyping,
  broadcastTyping,
  sendLoveNote,
  discoverLoveNote,
  REACTION_EMOJIS,
} from "../../services/chat/chatService";
import { uploadImage } from "../../services/storage/uploadImage";
import {
  notifyPartner,
} from "../../services/push/pushService";

import { celebrate } from "../../utils/celebrate";

import { supabase } from "../../services/supabase/supabaseClient";

import styles from "./Chat.module.css";

const LAST_SEEN_KEY =
  "momentry:chat-last-seen";

function dayLabel(iso) {
  const d = new Date(iso);

  const today = new Date();

  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (same(d, today)) return "Today";

  if (same(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString(
    undefined,
    { hour: "numeric", minute: "2-digit" }
  );
}

function Chat() {
  const { story } = useMoments();

  const { user } = useAuth();

  const notify = useNotification();

  const [loading, setLoading] =
    useState(true);

  const [messages, setMessages] = useState(
    []
  );

  const [partner, setPartner] =
    useState(null);

  const [draft, setDraft] = useState("");

  const [sending, setSending] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [unread, setUnread] = useState(0);

  const [hasStory, setHasStory] = useState(false);

  const [storyId, setStoryId] = useState(null);

  const [senderMap, setSenderMap] = useState(
    {}
  );

  const [reactingTo, setReactingTo] =
    useState(null);

  const [partnerTyping, setPartnerTyping] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [recordSecs, setRecordSecs] =
    useState(0);

  const [callState, setCallState] =
    useState(null);

  const listRef = useRef(null);

  const bottomRef = useRef(null);

  const attachRef = useRef(null);

  const recorderRef = useRef(null);

  const chunksRef = useRef([]);

  const recordTimerRef = useRef(null);

  const typingSentAtRef = useRef(0);

  const longPressRef = useRef(null);

  const recordSecsRef = useRef(0);

  //---------------------------------------
  // Load thread + partner
  //---------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const currentStory = story?.id
          ? story
          : await getMyStory();

        if (cancelled) return;

        if (!currentStory) {
          setLoading(false);

          setHasStory(false);

          return;
        }

        setStoryId(currentStory.id);

        setHasStory(true);

        const [rows, members] =
          await Promise.all([
            getChatMessages(
              currentStory.id
            ),

            getStoryMembers(
              currentStory.id
            ),
          ]);

        if (cancelled) return;

        setMessages(rows);

        setPartner(
          members.find(
            (m) =>
              m.user_id !== user?.id
          ) || null
        );

        // Sender names/avatars for the other
        // side of the thread (the FK is on
        // sender_id -> auth.users, not
        // profiles, so fetch them directly).
        const senderIds = [
          ...new Set(
            rows.map((r) => r.sender_id)
          ),
        ].filter((id) => id);

        if (senderIds.length) {
          const { data: senders } =
            await supabase
              .from("profiles")
              .select(
                "id, full_name, avatar_url"
              )
              .in("id", senderIds);

          if (senders?.length) {
            setSenderMap(
              Object.fromEntries(
                senders.map((s) => [
                  s.id,
                  s,
                ])
              )
            );
          }
        }

        // Opening the page marks the
        // thread as seen.
        localStorage.setItem(
          LAST_SEEN_KEY,
          String(Date.now())
        );

        setUnread(0);
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          notify.error(
            "Couldn't load chat",
            error.message ||
              "Please try again."
          );
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, user?.id]);

  //---------------------------------------
  // Realtime — partner's messages arrive
  // live; if the tab is hidden, count an
  // unread bubble.
  //---------------------------------------

  useEffect(() => {
    if (!storyId) return;

    const unsubscribe = subscribeToChat(
      storyId,
      {
        onInsert: (msg) => {
          if (!msg) return;

          setMessages((prev) =>
            prev.some(
              (m) => m.id === msg.id
            )
              ? prev
              : [...prev, msg]
          );

          if (
            msg.sender_id !==
              user?.id &&
            document.hidden
          ) {
            setUnread((n) => n + 1);
          }

          if (
            msg.sender_id !== user?.id
          ) {
            localStorage.setItem(
              LAST_SEEN_KEY,
              String(Date.now())
            );
          }
        },
      }
    );

    return unsubscribe;
  }, [loading, user?.id]);

  //---------------------------------------
  // Auto-scroll to the newest message
  //---------------------------------------

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, partnerTyping]);

  //---------------------------------------
  // Seen receipts — mark the partner's
  // messages seen when the thread is open.
  //---------------------------------------

  useEffect(() => {
    if (!storyId || !user?.id) return;

    markThreadSeen(storyId, user.id);
  }, [storyId, user?.id, messages.length]);

  //---------------------------------------
  // Typing indicator — partner's "typing…"
  //---------------------------------------

  useEffect(() => {
    if (!storyId || !user?.id) return;

    const unsubscribe = subscribeToTyping(
      storyId,
      user.id,
      (typing) => {
        setPartnerTyping(typing);
      }
    );

    return unsubscribe;
  }, [storyId, user?.id]);

  //---------------------------------------
  // Realtime UPDATEs — reactions and seen
  // receipts from the partner arrive here.
  //---------------------------------------

  useEffect(() => {
    if (!storyId) return;

    const channel = supabase
      .channel(
        `chat-upd-${storyId}-${Math.random()
          .toString(36)
          .slice(2, 8)}`
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `story_id=eq.${storyId}`,
        },
        (payload) => {
          const upd = payload.new;

          if (!upd) return;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === upd.id
                ? {
                    ...m,
                    reactions:
                      upd.reactions || {},
                    seen_at: upd.seen_at,
                  }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId]);

  //---------------------------------------
  // Group messages under day dividers
  //---------------------------------------

  const grouped = useMemo(() => {
    const out = [];

    let lastDay = null;

    for (const msg of messages) {
      const day = dayLabel(
        msg.created_at
      );

      if (day !== lastDay) {
        out.push({
          type: "divider",
          id: `div-${msg.id}`,
          label: day,
        });

        lastDay = day;
      }

      out.push({
        type: "message",
        ...msg,
      });
    }

    return out;
  }, [messages]);

  //---------------------------------------
  // Send — optimistic; failed sends show
  // a retry state.
  //---------------------------------------

  async function handleSend(e) {
    e?.preventDefault?.();

    const text = draft.trim();

    if (!text || sending) return;

    const tempId = `temp-${Date.now()}`;

    const optimistic = {
      id: tempId,
      story_id: storyId,
      sender_id: user?.id,
      body: text,
      image_url: null,
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [
      ...prev,
      optimistic,
    ]);

    setDraft("");

    setSending(true);

    try {
      const saved =
        await sendChatMessage(
          storyId,
          text
        );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? saved : m
        )
      );

      notifyPartner({
        storyId,

        senderId: user.id,

        title: "💬 New message",

        body: text.slice(0, 80),
      });
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, failed: true }
            : m
        )
      );

      notify.error(
        "Message not sent",
        error.message || "Tap to retry."
      );
    } finally {
      setSending(false);
    }
  }

  //---------------------------------------
  // LOVE NOTES JAR — write a sealed note;
  // the partner discovers it by tapping.
  //---------------------------------------

  const [noteOpen, setNoteOpen] = useState(false);

  const [noteText, setNoteText] = useState("");

  const [noteBusy, setNoteBusy] = useState(false);

  //---------------------------------------
  // Deep link: /chat?compose=note (from
  // the occasion banner) opens the note
  // composer right away, then cleans the
  // URL so a refresh doesn't reopen it.
  //---------------------------------------

  const [searchParams, setSearchParams] =
    useSearchParams();

  useEffect(() => {
    if (
      searchParams.get("compose") ===
        "note" &&
      storyId
    ) {
      // Defer the state updates out of the
      // effect body (React Compiler rule).
      const t = setTimeout(() => {
        setNoteOpen(true);

        searchParams.delete("compose");

        setSearchParams(searchParams, {
          replace: true,
        });
      }, 0);

      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, storyId]);

  async function handleSendNote() {
    const text = noteText.trim();

    if (!text || noteBusy) return;

    setNoteBusy(true);

    try {
      const saved = await sendLoveNote(
        storyId,
        text
      );

      setMessages((prev) => [
        ...prev,
        { ...saved, justSent: true },
      ]);

      // Mystery alert — never the note body.
      notifyPartner({
        storyId,

        senderId: user.id,

        isNote: true,
      });

      setNoteText("");

      setNoteOpen(false);

      notify.success(
        "Note sealed 💌",
        "It will stay sealed until your partner finds it."
      );
    } catch (error) {
      notify.error(
        "Couldn't seal the note",
        error.message || "Try again."
      );
    } finally {
      setNoteBusy(false);
    }
  }

  async function handleDiscoverNote(row) {
    try {
      await discoverLoveNote(row.id);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === row.id
            ? {
                ...m,
                discovered_at: new Date().toISOString(),
              }
            : m
        )
      );

      celebrate();
    } catch (error) {
      notify.error(
        "Couldn't open the note",
        error.message || "Tap again."
      );
    }
  }

  //---------------------------------------
  // Reactions — long-press opens the
  // picker; double-tap = instant ❤️.
  //---------------------------------------

  function toggleReactionLocal(msg, emoji) {
    const reactions = {
      ...(msg.reactions || {}),
    };

    if (reactions[user.id] === emoji) {
      delete reactions[user.id];
    } else {
      reactions[user.id] = emoji;
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? { ...m, reactions }
          : m
      )
    );

    setReaction(msg.id, reactions).catch(
      () => {
        notify.error(
          "Reaction failed",
          "Please try again."
        );
      }
    );
  }

  function handleBubbleTap(msg) {
    const now = Date.now();

    if (
      now - (msg._lastTap || 0) < 320
    ) {
      // Double tap — Instagram heart.
      toggleReactionLocal(msg, "❤️");
    }

    msg._lastTap = now;
  }

  function startLongPress(msg) {
    longPressRef.current = setTimeout(() => {
      setReactingTo(msg);
    }, 420);
  }

  function cancelLongPress() {
    clearTimeout(longPressRef.current);
  }

  //---------------------------------------
  // Typing broadcast — throttled.
  //---------------------------------------

  function handleDraftChange(e) {
    const value = e.target.value;

    setDraft(value);

    if (!storyId || !user?.id) return;

    const now = Date.now();

    if (now - typingSentAtRef.current > 1200) {
      typingSentAtRef.current = now;

      broadcastTyping(
        storyId,
        user.id,
        true
      );
    }
  }

  //---------------------------------------
  // Voice notes — hold to record.
  //---------------------------------------

  async function startRecording() {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          { audio: true }
        );

      const recorder = new MediaRecorder(
        stream
      );

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) =>
          t.stop()
        );

        const secs = recordSecsRef.current;

        const blob = new Blob(
          chunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        if (blob.size && secs >= 1) {
          try {
            setUploading(true);

            await sendVoiceNote(
              storyId,
              blob,
              secs * 1000
            );

            notifyPartner({
              storyId,

              senderId: user.id,

              title: "🎙️ Voice note",

              body: `Tap to listen (${secs}s)`,
            });
          } catch (error) {
            notify.error(
              "Voice note not sent",
              error.message ||
                "Please try again."
            );
          } finally {
            setUploading(false);
          }
        }
      };

      recorder.start();

      recorderRef.current = recorder;

      setRecording(true);

      setRecordSecs(0);

      recordSecsRef.current = 0;

      recordTimerRef.current = setInterval(
        () => {
          recordSecsRef.current += 1;

          setRecordSecs(
            recordSecsRef.current
          );

          // Hard cap: 60 seconds.
          if (
            recordSecsRef.current >= 60
          ) {
            stopRecording();
          }
        },
        1000
      );
    } catch {
      notify.error(
        "Microphone unavailable",
        "Allow mic access to send voice notes."
      );
    }
  }

  function stopRecording() {
    clearInterval(recordTimerRef.current);

    recorderRef.current?.stop();

    recorderRef.current = null;

    setRecording(false);
  }

  async function handleRetry(tempId) {
    const msg = messages.find(
      (m) => m.id === tempId
    );

    if (!msg) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId
          ? { ...m, failed: false, pending: true }
          : m
      )
    );

    try {
      const saved =
        await sendChatMessage(
          storyId,
          msg.body
        );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? saved : m
        )
      );

      notifyPartner({
        storyId,

        senderId: user.id,

        title: "💬 New message",

        body: (msg.body || "")
          .slice(0, 80),
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, failed: true }
            : m
        )
      );
    }
  }

  //---------------------------------------
  // Photo attachment
  //---------------------------------------

  async function handleAttach(e) {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    try {
      setUploading(true);

      const url = await uploadImage(
        file
      );

      await sendChatMessage(
        storyId,
        draft.trim(),
        url
      );

      notifyPartner({
        storyId,

        senderId: user.id,

        title: "📷 Photo",

        body: draft.trim()
          ? draft.trim().slice(0, 80)
          : "Tap to view",
      });

      setDraft("");
    } catch (error) {
      notify.error(
        "Photo not sent",
        error.message ||
          "Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  //---------------------------------------
  // Empty states
  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <Loader label="Opening chat…" />
        </Container>
      </PageLayout>
    );
  }

  if (!hasStory) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <div
            className={styles.emptyCard}
          >
            <span>💬</span>

            <h2>No story yet</h2>

            <p>
              Create your story first — then
              chat with your partner here.
            </p>

            <Link to="/create-story">
              <Button>Create story</Button>
            </Link>
          </div>
        </Container>
      </PageLayout>
    );
  }

  // Calls: partner presence + handlers are
  // provided by the CallOverlay integration.

  const partnerHasAudio = Boolean(partner);

  function onStartCall() {
    setCallState("calling");
  }

  // Partner name: prefer the membership
  // row, fall back to the chat sender map.
  const partnerName =
    partner?.profiles?.full_name ||
    (partner &&
      senderMap[partner.user_id]
        ?.full_name) ||
    "Your partner";

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.chatShell}>
          {/* -------- Partner header -------- */}

          <button
            type="button"
            className={styles.partnerBar}
            onClick={() =>
              setProfileOpen(true)
            }
            disabled={!partner}
          >
            <span
              className={styles.avatar}
              aria-hidden="true"
            >
              {partner?.profiles
                ?.avatar_url ? (
                <img
                  src={
                    partner.profiles
                      .avatar_url
                  }
                  alt=""
                />
              ) : (
                partnerName
                  .trim()
                  .charAt(0)
                  .toUpperCase() || "♥"
              )}
            </span>

            <span
              className={styles.partnerMeta}
            >
              <strong>
                {partnerName}
              </strong>

              <small>
                {partner
                  ? "Tap to view profile"
                  : "Invite your partner from Settings to start chatting"}
              </small>
            </span>

            {unread > 0 && (
              <span
                className={styles.unreadPill}
              >
                {unread} new
              </span>
            )}
          </button>

          {/* -------- Thread -------- */}

          <div
            className={styles.thread}
            ref={listRef}
          >
            {messages.length === 0 ? (
              <div
                className={styles.emptyThread}
              >
                <span>👋</span>

                <p>
                  Say hi to{" "}
                  {partnerName} — every
                  message lands instantly on
                  their phone.
                </p>
              </div>
            ) : (
              grouped.map((row) =>
                row.type ===
                "divider" ? (
                  <div
                    key={row.id}
                    className={
                      styles.dayDivider
                    }
                  >
                    <span>
                      {row.label}
                    </span>
                  </div>
                ) : (
                  <div
                    key={row.id}
                    className={[
                      styles.row,
                      row.sender_id ===
                      user?.id
                        ? styles.rowMine
                        : styles.rowTheirs,
                    ]}
                  >
                    <div
                      className={[
                        styles.bubble,
                        row.sender_id ===
                        user?.id
                          ? styles.bubbleMine
                          : styles.bubbleTheirs,
                        row.pending
                          ? styles.bubblePending
                          : "",
                        row.failed
                          ? styles.bubbleFailed
                          : "",
                      ].join(" ")}
                      onClick={() => {
                        if (row.failed) {
                          handleRetry(row.id);

                          return;
                        }

                        if (
                          row.kind === "text"
                        ) {
                          handleBubbleTap(row);
                        }
                      }}
                      onTouchStart={() =>
                        startLongPress(row)
                      }
                      onTouchEnd={
                        cancelLongPress
                      }
                      onTouchMove={
                        cancelLongPress
                      }
                      onContextMenu={(e) => {
                        // Desktop long-press
                        // equivalent.
                        e.preventDefault();

                        setReactingTo(row);
                      }}
                    >
                      {row.image_url &&
                        row.kind !== "voice" && (
                          <img
                            src={
                              row.image_url
                            }
                            alt="Shared photo"
                            className={
                              styles.bubbleImage
                            }
                            loading="lazy"
                          />
                        )}

                      {row.kind ===
                        "voice" && (
                          <audio
                            src={
                              row.image_url
                            }
                            controls
                            preload="metadata"
                            className={
                              styles.voicePlayer
                            }
                          />
                        )}

                      {row.kind === "note" &&
                        row.sender_id !==
                          user?.id &&
                        !row.discovered_at && (
                          <button
                            type="button"
                            className={
                              styles.noteSealed
                            }
                            onClick={() =>
                              handleDiscoverNote(
                                row
                              )
                            }
                          >
                            <span
                              className={
                                styles.noteSealIcon
                              }
                            >
                              💌
                            </span>

                            <span>
                              A sealed note from
                              your person — tap
                              to open
                            </span>
                          </button>
                        )}

                      {!(row.kind === "note" &&
                        row.sender_id !==
                          user?.id &&
                        !row.discovered_at) && (
                        <p>
                          {row.kind === "note"
                            ? `💌 ${row.body}`
                            : row.body}
                        </p>
                      )}

                      <small
                        className={
                          styles.bubbleTime
                        }
                      >
                        {row.failed
                          ? "Not sent — tap to retry"
                          : timeLabel(
                              row.created_at
                            )}
                        {row.sender_id ===
                          user?.id &&
                          row.seen_at &&
                          " ✓✓"}
                      </small>

                      {/* Reaction chip */}

                      {row.reactions &&
                        Object.keys(row.reactions)
                          .length > 0 && (
                          <span
                            className={
                              styles.reactionChip
                            }
                          >
                            {
                              row.reactions[
                                Object.keys(
                                  row.reactions
                                )[0]
                              ]
                            }
                          </span>
                        )}
                    </div>
                  </div>
                )
              )
            )}

            {partnerTyping && (
              <div
                className={styles.typingRow}
              >
                <div
                  className={
                    styles.typingBubble
                  }
                >
                  <span />

                  <span />

                  <span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* -------- Composer -------- */}

          <form
            className={styles.composer}
            onSubmit={handleSend}
          >
            <button
              type="button"
              className={styles.attachButton}
              onClick={() =>
                attachRef.current?.click()
              }
              disabled={uploading || !partner}
              aria-label="Attach a photo"
              title="Attach a photo"
            >
              <ImagePlus size={20} />
            </button>

            <button
              type="button"
              className={
                styles.attachButton
              }
              onClick={() =>
                setNoteOpen(true)
              }
              disabled={!partner}
              aria-label="Hide a love note"
              title="Hide a love note 💌"
            >
              💌
            </button>

            <input
              ref={attachRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAttach}
            />

            <input
              className={styles.input}
              value={draft}
              onChange={
                handleDraftChange
              }
              placeholder={
                uploading
                  ? "Uploading photo…"
                  : `Message ${partnerName}…`
              }
              maxLength={2000}
              aria-label="Message"
            />

            {draft.trim() ? (
              <button
                type="submit"
                className={styles.sendButton}
                disabled={sending || uploading}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                className={
                  recording
                    ? `${styles.sendButton} ${styles.recordingPulse}`
                    : styles.sendButton
                }
                onClick={
                  recording
                    ? stopRecording
                    : startRecording
                }
                aria-label={
                  recording
                    ? "Stop and send voice note"
                    : "Record voice note"
                }
                title={
                  recording
                    ? "Tap to send"
                    : "Voice note"
                }
              >
                <Mic size={18} />
              </button>
            )}
          </form>

          {noteOpen && (
            <div
              className={styles.noteModalScrim}
              onClick={() =>
                noteBusy
                  ? null
                  : setNoteOpen(false)
              }
            >
              <div
                className={styles.noteModal}
                onClick={(e) =>
                  e.stopPropagation()
                }
                role="dialog"
                aria-label="Write a love note"
              >
                <h3>
                  💌 Hide a love note
                </h3>

                <p>
                  It lands sealed in{" "}
                  {partnerName}'s chat —
                  they'll find it when they
                  open the thread.
                </p>

                <textarea
                  value={noteText}
                  onChange={(e) =>
                    setNoteText(
                      e.target.value
                    )
                  }
                  placeholder="Write something they'll smile at…"
                  rows={4}
                  maxLength={500}
                  autoFocus
                />

                <div
                  className={
                    styles.noteModalActions
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setNoteOpen(false)
                    }
                    disabled={noteBusy}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className={
                      styles.noteSend
                    }
                    onClick={
                      handleSendNote
                    }
                    disabled={
                      noteBusy ||
                      !noteText.trim()
                    }
                  >
                    {noteBusy
                      ? "Sealing…"
                      : "Seal & send 💌"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Call buttons under the composer */}

          <div className={styles.callRow}>
            <button
              type="button"
              className={styles.callButton}
              onClick={onStartCall}
              disabled={!partner || !partnerHasAudio}
              aria-label="Start voice call"
            >
              <Phone size={16} />

              Voice call
            </button>
          </div>

          {recording && (
            <div className={styles.recordBar}>
              <span
                className={styles.recordDot}
              />

              Recording… {recordSecs}s

              <button
                type="button"
                className={styles.recordCancel}
                onClick={() => {
                  chunksRef.current = [];

                  recordSecsRef.current = 0;

                  stopRecording();
                }}
              >
                <X size={14} />

                Cancel
              </button>
            </div>
          )}
        </div>

        {/* -------- Reaction picker -------- */}

        {reactingTo && (
          <div
            className={styles.reactionSheet}
            onClick={() => setReactingTo(null)}
          >
            <div
              className={
                styles.reactionSheetInner
              }
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {REACTION_EMOJIS.map(
                (emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={
                      styles.reactionOption
                    }
                    onClick={() => {
                      toggleReactionLocal(
                        reactingTo,
                        emoji
                      );

                      setReactingTo(null);
                    }}
                  >
                    {emoji}
                  </button>
                )
              )}

              <button
                type="button"
                className={
                  styles.reactionClose
                }
                onClick={() =>
                  setReactingTo(null)
                }
                aria-label="Cancel"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* -------- Voice call -------- */}

        <CallOverlay
          storyId={storyId}
          myUserId={user?.id}
          partnerName={partnerName}
          state={callState}
          onStateChange={setCallState}
          onClose={() => setCallState(null)}
        />

        {/* -------- Partner profile -------- */}

        {profileOpen && partner && (
          <PartnerProfileModal
            member={partner}
            storyTitle={story?.title}
            onClose={() =>
              setProfileOpen(false)
            }
          />
        )}
      </Container>
    </PageLayout>
  );
}

export default Chat;
