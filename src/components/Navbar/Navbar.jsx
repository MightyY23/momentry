import { useEffect, useState } from "react";

import { NavLink } from "react-router-dom";

import {
  BookHeart,
  CalendarDays,
  Home,
  Images,
  MapPinned,
  MessageCircle,
  PenLine,
  Search,
  Settings,
  UserRound,
} from "lucide-react";

import useMoments from "../../hooks/useMoments";

import StorySettingsModal from "../StorySettingsModal/StorySettingsModal";

import styles from "./Navbar.module.css";

/**
 * Emits the global event the CommandPalette
 * listens for, so search works from any page.
 */
function openSearch() {
  window.dispatchEvent(
    new CustomEvent("momentry:open-search")
  );
}

function Navbar() {
  const { story } = useMoments();

  const tabs = [
    {
      path: "/home",
      icon: Home,
      label: "Home",
    },
    {
      path: "/gallery",
      icon: Images,
      label: "Gallery",
    },
    {
      path: "/storybook",
      icon: BookHeart,
      label: "StoryBook",
    },
    {
      path: "/memory-map",
      icon: MapPinned,
      label: "Map",
    },
    {
      path: "/calendar",
      icon: CalendarDays,
      label: "Calendar",
    },
    {
      path: "/profile",
      icon: UserRound,
      label: "Profile",
    },
  ];

  return (
    <header className={styles.wrapper}>
      <nav
        className={styles.navbar}
        aria-label="Top bar"
      >
        {/* Brand */}

        <NavLink
          to="/home"
          className={styles.brand}
          aria-label="Momentry home"
        >
          {story?.cover_photo ? (
            <span
              className={
                styles.logoCover
              }
            >
              <img
                src={
                  story.cover_photo
                }
                alt=""
              />
            </span>
          ) : (
            <span className={styles.logoCircle}>
              ♥
            </span>
          )}

          <span className={styles.brandText}>
            {story?.title || "Momentry"}
          </span>
        </NavLink>

        {/* Actions: chat, story settings,
            search, settings */}

        <div className={styles.actions}>
          <NavLink
            to="/chat"
            className={styles.iconButton}
            aria-label="Chat with your partner"
            title="Chat"
          >
            <MessageCircle size={20} />

            <ChatUnreadDot />
          </NavLink>

          <button
            type="button"
            className={styles.iconButton}
            onClick={openSearch}
            aria-label="Search memories"
            title="Search memories (Ctrl+K)"
          >
            <Search size={20} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent(
                  "momentry:open-story-settings"
                )
              )
            }
            aria-label="Story settings"
            title="Story settings"
          >
            <PenLine size={20} />
          </button>

          <NavLink
            to="/settings"
            className={
              styles.iconButton
            }
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={20} />
          </NavLink>
        </div>
      </nav>

      {/* Mobile bottom tab bar
          (thumb-reach app nav) */}

      <nav
        className={styles.tabbar}
        aria-label="Primary"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                isActive
                  ? `${styles.tab} ${styles.tabActive}`
                  : styles.tab
              }
            >
              <Icon size={22} />

              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Spacer so the fixed tab bar
          never hides page content */}

      <div className={styles.tabSpacer} />

      {/* Story Settings — opened from the
          top bar (event) or directly here
          via ref-style fallback */}

      <StorySettingsHost story={story} />
    </header>
  );
}

/**
 * Listens for the global story-settings
 * event so the modal opens from the
 * top-bar icon on any page.
 */
import { useEffect as useEffectHost, useState as useStateHost } from "react";

function StorySettingsHost({ story }) {
  const [open, setOpen] = useStateHost(false);

  useEffectHost(() => {
    function handleOpen() {
      setOpen(true);
    }

    window.addEventListener(
      "momentry:open-story-settings",
      handleOpen
    );

    return () =>
      window.removeEventListener(
        "momentry:open-story-settings",
        handleOpen
      );
  }, []);

  return (
    <StorySettingsModal
      open={open}
      onClose={() => setOpen(false)}
      story={story}
    />
  );
}

export default Navbar;

/**
 * Live unread indicator for the partner
 * chat. Subscribes to the story's chat
 * thread and shows a dot when a message
 * arrived after the last time /chat was
 * open. Cheap: one realtime channel per
 * logged-in app session.
 */
function ChatUnreadDot() {
  const [dot, setDot] = useState(false);

  useEffect(() => {
    let unsubscribe = null;

    let seenAt = Number(
      localStorage.getItem(
        "momentry:chat-last-seen"
      ) || 0
    );

    async function wire() {
      const {
        getMyStory,
      } = await import(
        "../../services/story/getStory"
      );

      const {
        subscribeToChat,
      } = await import(
        "../../services/chat/chatService"
      );

      let story;

      try {
        story = await getMyStory();
      } catch {
        return;
      }

      if (!story) return;

      unsubscribe = subscribeToChat(
        story.id,
        {
          onInsert: async (msg) => {
            if (!msg) return;

            // Own sends never count as unread.
            const { supabase } =
              await import(
                "../../services/supabase/supabaseClient"
              );

            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (
              user &&
              msg.sender_id === user.id
            ) {
              return;
            }

            seenAt = Number(
              localStorage.getItem(
                "momentry:chat-last-seen"
              ) || 0
            );

            const at = new Date(
              msg.created_at
            ).getTime();

            if (at > seenAt) {
              setDot(true);
            }
          },
        }
      );
    }

    wire();

    function markSeen() {
      if (
        window.location.pathname ===
        "/chat"
      ) {
        localStorage.setItem(
          "momentry:chat-last-seen",
          String(Date.now())
        );

        setDot(false);
      }
    }

    window.addEventListener(
      "focus",
      markSeen
    );

    const poll = setInterval(
      markSeen,
      1500
    );

    return () => {
      unsubscribe?.();

      window.removeEventListener(
        "focus",
        markSeen
      );

      clearInterval(poll);
    };
  }, []);

  if (!dot) return null;

  return (
    <span
      className={styles.unreadDot}
      aria-label="New chat messages"
    />
  );
}
