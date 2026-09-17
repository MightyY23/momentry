import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { ImagePlus, Send } from "lucide-react";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";
import Loader from "../../ui/Loader/Loader";
import Button from "../../ui/Button/Button";

import PartnerProfileModal from "../../components/PartnerProfileModal/PartnerProfileModal";

import { useAuth } from "../../contexts/useAuth";

import useMoments from "../../hooks/useMoments";
import useNotification from "../../hooks/useNotification";

import { getMyStory } from "../../services/story/getStory";
import { getStoryMembers } from "../../services/story/members";
import {
  getChatMessages,
  sendChatMessage,
  subscribeToChat,
} from "../../services/chat/chatService";
import { uploadImage } from "../../services/storage/uploadImage";

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

  const listRef = useRef(null);

  const bottomRef = useRef(null);

  const attachRef = useRef(null);

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
  }, [messages.length]);

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
                      onClick={
                        row.failed
                          ? () =>
                              handleRetry(
                                row.id
                              )
                          : undefined
                      }
                      role={
                        row.failed
                          ? "button"
                          : undefined
                      }
                    >
                      {row.image_url && (
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

                      {row.body && (
                        <p>
                          {row.body}
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
                      </small>
                    </div>
                  </div>
                )
              )
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
              onChange={(e) =>
                setDraft(e.target.value)
              }
              placeholder={
                uploading
                  ? "Uploading photo…"
                  : `Message ${partnerName}…`
              }
              maxLength={2000}
              aria-label="Message"
            />

            <button
              type="submit"
              className={styles.sendButton}
              disabled={
                sending ||
                uploading ||
                !draft.trim()
              }
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

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
