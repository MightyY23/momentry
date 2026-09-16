import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../../../services/supabase/supabaseClient";

import Button from "../../../../ui/Button/Button";
import ConfirmDialog from "../../../../ui/ConfirmDialog/ConfirmDialog";

import { getMyStory } from "../../../../services/story/getStory";
import {
  getStoryMembers,
  removeStoryMember,
} from "../../../../services/story/members";
import { createInvitation } from "../../../../services/invitation/createInvitation";
import { cancelInvitation } from "../../../../services/invitation/cancelInvitation";
import { leaveStory } from "../../../../services/story/leaveStory";

import useNotification from "../../../../hooks/useNotification";

import styles from "./Partner.module.css";

const ROLE_LABELS = {
  owner: "Owner",
  editor: "Partner",
  viewer: "Viewer",
};

function Partner() {
  const notify = useNotification();

  const navigate = useNavigate();

  const [story, setStory] = useState(null);

  const [members, setMembers] = useState([]);

  const [pendingInvite, setPendingInvite] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [myUserId, setMyUserId] = useState(null);

  //---------------------------------------
  // Invite form
  //---------------------------------------

  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);

  //---------------------------------------
  // Danger actions
  //---------------------------------------

  const [confirmCancel, setConfirmCancel] =
    useState(false);

  const [confirmLeave, setConfirmLeave] =
    useState(false);

  const [leaving, setLeaving] = useState(false);

  const [confirmRemove, setConfirmRemove] =
    useState(false);

  const [removing, setRemoving] = useState(false);

  //---------------------------------------
  // Load story, members, pending invite
  //---------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        setMyUserId(user?.id ?? null);

        const storyData = await getMyStory();

        if (cancelled) return;

        setStory(storyData);

        if (!storyData) {
          return;
        }

        const memberData =
          await getStoryMembers(
            storyData.id
          );

        if (cancelled) return;

        setMembers(memberData || []);

        // Pending invitations for this story —
        // the owner sees them through the
        // invitations_select policy.
        const { data: invites } =
          await supabase
            .from("invitations")
            .select(
              "id, email, created_at"
            )
            .eq(
              "story_id",
              storyData.id
            )
            .eq("status", "pending")
            .order("created_at", {
              ascending: false,
            });

        if (cancelled) return;

        setPendingInvite(
          invites?.[0] ?? null
        );
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          notify.error(
            "Couldn't load partner info",
            "Please try again in a moment."
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
  }, []);

  //---------------------------------------
  // Derived
  //---------------------------------------

  const amIOwner =
    members.some(
      (m) =>
        m.user_id === myUserId &&
        m.role === "owner"
    ) ?? false;

  const partner = members.find(
    (m) => m.user_id !== myUserId
  );

  const isSolo = members.length <= 1;

  //---------------------------------------
  // Actions
  //---------------------------------------

  async function handleInvite(e) {
    e?.preventDefault?.();

    if (!story) return;

    try {
      setSending(true);

      await createInvitation(
        story.id,
        email.trim()
      );

      notify.success(
        "Invitation sent!",
        `${email.trim()} can accept from their Momentry after signing up.`
      );

      setEmail("");

      // Refresh pending state
      const { data: invites } =
        await supabase
          .from("invitations")
          .select("id, email, created_at")
          .eq("story_id", story.id)
          .eq("status", "pending");

      setPendingInvite(
        invites?.[0] ?? null
      );
    } catch (error) {
      notify.error(
        "Couldn't send invitation",
        error.message || "Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleCancelInvite() {
    if (!pendingInvite) return;

    try {
      await cancelInvitation(
        pendingInvite.id
      );

      setPendingInvite(null);

      notify.success(
        "Invitation cancelled",
        "They can no longer join this story."
      );
    } catch (error) {
      notify.error(
        "Couldn't cancel invitation",
        error.message || "Please try again."
      );
    } finally {
      setConfirmCancel(false);
    }
  }

  async function handleLeave() {
    if (!story) return;

    try {
      setLeaving(true);

      await leaveStory(story.id);

      notify.success(
        "You've left the story",
        "Create a new one or wait for a fresh invitation."
      );

      setConfirmLeave(false);

      navigate("/create-story", {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't leave the story",
        error.message || "Please try again."
      );

      setLeaving(false);
      setConfirmLeave(false);
    }
  }

  async function handleRemovePartner() {
    if (!partner) return;

    try {
      setRemoving(true);

      await removeStoryMember(partner.id);

      setMembers((prev) =>
        prev.filter(
          (m) => m.id !== partner.id
        )
      );

      notify.success(
        "Partner removed",
        "They no longer have access. You can invite them again anytime."
      );

      setConfirmRemove(false);
    } catch (error) {
      console.error(error);

      notify.error(
        "Couldn't remove partner",
        error.message || "Please try again."
      );

      setRemoving(false);
      setConfirmRemove(false);
    }
  }

  //---------------------------------------
  // Render
  //---------------------------------------

  if (loading) {
    return (
      <p className={styles.hint}>
        Loading…
      </p>
    );
  }

  if (!story) {
    return (
      <p className={styles.hint}>
        You're not part of a story yet — create
        one to invite your partner.
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* -------- Partner / status card -------- */}

      <div className={styles.infoCard}>
        {partner ? (
          <>
            <div className={styles.partnerRow}>
              <span
                className={styles.avatar}
                aria-hidden="true"
              >
                {(
                  partner.profiles
                    ?.full_name || "♥"
                )
                  .trim()
                  .charAt(0)
                  .toUpperCase() || "♥"}
              </span>

              <div className={styles.partnerMeta}>
                <span
                  className={styles.partnerName}
                >
                  {partner.profiles
                    ?.full_name ||
                    "Your partner"}
                </span>

                <span
                  className={styles.partnerRole}
                >
                  {ROLE_LABELS[
                    partner.role
                  ] ?? "Member"}{" "}
                  · in your story
                </span>
              </div>
            </div>

            <p className={styles.hint}>
              You're sharing this story. Memories
              either of you adds appear on both
              accounts instantly.
            </p>

            {amIOwner && (
              <>
                <p className={styles.hint}>
                  Removing them unpairs your
                  accounts — the story and all its
                  memories stay yours.
                </p>

                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirmRemove(true)
                    }
                  >
                    Remove partner
                  </Button>
                </div>
              </>
            )}
          </>
        ) : pendingInvite ? (
          <>
            <div className={styles.partnerRow}>
              <span
                className={styles.avatarPending}
                aria-hidden="true"
              >
                ✉
              </span>

              <div className={styles.partnerMeta}>
                <span
                  className={styles.partnerName}
                >
                  {
                    pendingInvite.email
                  }
                </span>

                <span
                  className={styles.partnerRole}
                >
                  Invitation pending
                </span>
              </div>
            </div>

            <p className={styles.hint}>
              They'll see the invite as soon as they
              sign up or sign in to Momentry.
            </p>

            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() =>
                  setConfirmCancel(true)
                }
              >
                Cancel invitation
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.partnerRow}>
              <span
                className={styles.avatarPending}
                aria-hidden="true"
              >
                ♥
              </span>

              <div className={styles.partnerMeta}>
                <span
                  className={styles.partnerName}
                >
                  {isSolo
                    ? "It's just you so far"
                    : "Story partner"}
                </span>

                <span
                  className={styles.partnerRole}
                >
                  No partner connected
                </span>
              </div>
            </div>

            <p className={styles.hint}>
              Every great story has two authors —
              invite yours by email.
            </p>
          </>
        )}
      </div>

      {/* -------- Invite form (no partner) -------- */}

      {!partner && (
        <form
          className={styles.form}
          onSubmit={handleInvite}
        >
          <label
            className={styles.label}
            htmlFor="partner-email"
          >
            Partner's email
          </label>

          <input
            id="partner-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder="partner@email.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <Button
            type="submit"
            disabled={sending || !email.trim()}
          >
            {sending
              ? "Sending…"
              : "Send invitation"}
          </Button>
        </form>
      )}

      {/* -------- Leave story (member only) -------- */}

      {!amIOwner && (
        <div className={styles.dangerBox}>
          <div>
            <p className={styles.dangerTitle}>
              Leave this story
            </p>

            <p className={styles.hint}>
              You'll lose access to every memory in
              it. Your partner keeps the story.
              Re-joining needs a new invitation.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => setConfirmLeave(true)}
          >
            Leave story
          </Button>
        </div>
      )}

      {/* -------- Confirmations -------- */}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this invitation?"
        message={`"${pendingInvite?.email}" will no longer be able to join this story. You can invite them again anytime.`}
        confirmLabel="Cancel invitation"
        cancelLabel="Keep it"
        onConfirm={handleCancelInvite}
        onCancel={() =>
          setConfirmCancel(false)
        }
      />

      <ConfirmDialog
        open={confirmLeave}
        title="Leave this story?"
        message="You'll lose access to the story and all its memories on both accounts. This can't be undone without a new invitation."
        confirmLabel="Leave story"
        cancelLabel="Stay"
        danger
        loading={leaving}
        onConfirm={handleLeave}
        onCancel={() =>
          setConfirmLeave(false)
        }
      />

      <ConfirmDialog
        open={confirmRemove}
        title={`Remove ${partner?.profiles?.full_name || "your partner"}?`}
        message="They'll immediately lose access to this story. Their memories stay in it, and you can invite them back anytime."
        confirmLabel="Remove partner"
        cancelLabel="Keep them"
        danger
        loading={removing}
        onConfirm={handleRemovePartner}
        onCancel={() =>
          setConfirmRemove(false)
        }
      />
    </div>
  );
}

export default Partner;
