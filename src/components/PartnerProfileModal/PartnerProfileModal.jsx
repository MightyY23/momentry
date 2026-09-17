import { useMemo } from "react";

import { useNavigate } from "react-router-dom";

import { MessageCircle } from "lucide-react";

import Modal from "../../ui/Modal/Modal";
import Button from "../../ui/Button/Button";

import styles from "./PartnerProfileModal.module.css";

/**
 * Who is my partner? A small profile card:
 * avatar, name, birthday countdown, role,
 * story membership. Actions: open the chat,
 * or close. The member row comes from
 * getStoryMembers (profile fields included).
 */
function PartnerProfileModal({
  member,
  storyTitle,
  open = true,
  onClose,
}) {
  const navigate = useNavigate();

  // getStoryMembers returns the profile
  // under `profiles` (joined relation);
  // guard both shapes just in case.
  const profile =
    member?.profiles || member || {};

  const birthday = useMemo(() => {
    if (!profile.birth_date) return null;

    // Accept both a bare date (YYYY-MM-DD)
    // and a full timestamptz — take the
    // month/day parts and rebuild a local
    // date for this year.
    const raw =
      typeof profile.birth_date === "string"
        ? profile.birth_date.slice(0, 10)
        : null;

    if (!raw || raw.length < 10) return null;

    const [, month, day] = raw.split("-");

    const now = new Date();

    const next = new Date(
      now.getFullYear(),
      Number(month) - 1,
      Number(day)
    );

    // Already passed this year — look at
    // next year's occasion.
    if (next < now) {
      next.setFullYear(
        next.getFullYear() + 1
      );
    }

    const days = Math.ceil(
      (next - now) / (1000 * 60 * 60 * 24)
    );

    return {
      date: next.toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "long",
        }
      ),

      days,

      isToday: days === 0 || days === 365,
    };
  }, [profile.birth_date]);

  const name =
    profile.full_name || "Your partner";

  const joined = member?.created_at
    ? new Date(
        member.created_at
      ).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={name}
      subtitle="Partner profile"
    >
      <div className={styles.card}>
        {/* -------- Avatar -------- */}

        <div className={styles.hero}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${name}'s avatar`}
              className={styles.avatarImg}
            />
          ) : (
            <span
              className={styles.avatarFallback}
              aria-hidden="true"
            >
              {name.trim().charAt(0).toUpperCase() ||
                "♥"}
            </span>
          )}

          <div className={styles.heroText}>
            <h3>{name}</h3>

            <span
              className={styles.roleChip}
            >
              {member?.role === "owner"
                ? "Story owner"
                : member?.role === "editor"
                  ? "Editor"
                  : "Viewer"}{" "}
              · in your story
            </span>
          </div>
        </div>

        {/* -------- Facts -------- */}

        <dl className={styles.facts}>
          {storyTitle && (
            <div className={styles.fact}>
              <dt>📖 Story</dt>

              <dd>{storyTitle}</dd>
            </div>
          )}

          {birthday && (
            <div className={styles.fact}>
              <dt>🎂 Birthday</dt>

              <dd>
                {birthday.isToday
                  ? "Today — celebrate! 🎉"
                  : `${birthday.date} · ${
                      birthday.days
                    } day${
                      birthday.days === 1
                        ? ""
                        : "s"
                    } to go`}
              </dd>
            </div>
          )}

          {joined && (
            <div className={styles.fact}>
              <dt>♥ Joined</dt>

              <dd>{joined}</dd>
            </div>
          )}
        </dl>

        {/* -------- Actions -------- */}

        <div className={styles.actions}>
          <Button
            onClick={() => {
              onClose();

              navigate("/chat");
            }}
          >
            <MessageCircle size={16} />
            Open chat
          </Button>

          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PartnerProfileModal;
