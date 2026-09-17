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
import {
  getOrCreatePairCode,
  regeneratePairCode,
  lookupPairCode,
  pairWithCode,
} from "../../../../services/pairing/pairing";

import useNotification from "../../../../hooks/useNotification";

import PartnerProfileModal from "../../../../components/PartnerProfileModal/PartnerProfileModal";

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

  const [viewProfile, setViewProfile] = useState(false);

  //---------------------------------------
  // Partner code pairing (email-free)
  //---------------------------------------

  const [myCode, setMyCode] = useState(null);

  const [codeExpiry, setCodeExpiry] = useState(null);

  const [codeLoading, setCodeLoading] = useState(true);

  const [regenerating, setRegenerating] =
    useState(false);

  const [copied, setCopied] = useState(false);

  const [enterCodeMode, setEnterCodeMode] =
    useState(false);

  const [enteredCode, setEnteredCode] = useState("");

  const [lookup, setLookup] = useState(null);

  const [lookingUp, setLookingUp] = useState(false);

  const [pairing, setPairing] = useState(false);

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

        // My partner code (created lazily,
        // 7-day validity — see migration 023).
        try {
          const codeRows =
            await getOrCreatePairCode();

          if (cancelled) return;

          setMyCode(codeRows[0]?.pair_code ?? null);

          setCodeExpiry(
            codeRows[0]?.expires_at ?? null
          );
        } catch (codeError) {
          console.error(codeError);
        } finally {
          if (!cancelled) {
            setCodeLoading(false);
          }
        }
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

  //---------------------------------------
  // Partner code actions
  //---------------------------------------

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(
        myCode
      );

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error(
        "Couldn't copy",
        "Long-press the code to copy it manually."
      );
    }
  }

  async function handleRegenerateCode() {
    try {
      setRegenerating(true);

      const rows = await regeneratePairCode();

      setMyCode(rows[0]?.pair_code ?? null);
      setCodeExpiry(rows[0]?.expires_at ?? null);

      notify.success(
        "New code ready",
        "The old code no longer works."
      );
    } catch (error) {
      notify.error(
        "Couldn't make a new code",
        error.message || "Please try again."
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function handleLookupCode(e) {
    e?.preventDefault?.();

    const code = enteredCode.trim().toUpperCase();

    if (code.length < 6) return;

    try {
      setLookingUp(true);
      setLookup(null);

      const result = await lookupPairCode(code);

      setLookup(result);
    } catch (error) {
      notify.error(
        "Couldn't check that code",
        error.message || "Please try again."
      );
    } finally {
      setLookingUp(false);
    }
  }

  async function handlePair() {
    const code = enteredCode.trim().toUpperCase();

    try {
      setPairing(true);

      await pairWithCode(code);

      notify.success(
        "You're paired! 💞",
        "Your stories are now connected — memories sync instantly."
      );

      // Full reload of partner state
      setEnterCodeMode(false);
      setEnteredCode("");
      setLookup(null);

      const storyData = await getMyStory();

      setStory(storyData);

      if (storyData) {
        const memberData = await getStoryMembers(
          storyData.id
        );

        setMembers(memberData || []);
      }
    } catch (error) {
      notify.error(
        "Couldn't pair",
        error.message || "Please try again."
      );
    } finally {
      setPairing(false);
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
            <button
              type="button"
              className={styles.partnerRow}
              onClick={() =>
                setViewProfile(true)
              }
              aria-label={`View ${partner.profiles?.full_name || "partner"}'s profile`}
            >
              {partner.profiles
                ?.avatar_url ? (
                <img
                  src={
                    partner.profiles
                      .avatar_url
                  }
                  alt=""
                  className={
                    styles.avatarImg
                  }
                />
              ) : (
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
              )}

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
            </button>

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

      {/* -------- Partner code pairing (no partner) -------- */}

      {!partner && (
        <div className={styles.codeCard}>
          {enterCodeMode ? (
            <>
              <p className={styles.codeTitle}>
                Enter your partner's code
              </p>

              <form
                className={styles.codeForm}
                onSubmit={handleLookupCode}
              >
                <input
                  className={styles.codeInput}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="ABC123"
                  maxLength={6}
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(
                      e.target.value.toUpperCase()
                    );
                    setLookup(null);
                  }}
                />

                <Button
                  type="submit"
                  disabled={
                    lookingUp ||
                    enteredCode.trim().length < 6
                  }
                >
                  {lookingUp
                    ? "Checking…"
                    : "Check code"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setEnterCodeMode(false);
                    setLookup(null);
                    setEnteredCode("");
                  }}
                >
                  Back
                </Button>
              </form>

              {lookup && !lookup.valid && (
                <p className={styles.codeError}>
                  {lookup.reason}
                </p>
              )}

              {lookup?.valid && (
                <div className={styles.codeFound}>
                  <span
                    className={styles.foundAvatar}
                    aria-hidden="true"
                  >
                    {(lookup.fullName || "♥")
                      .trim()
                      .charAt(0)
                      .toUpperCase() || "♥"}
                  </span>

                  <div
                    className={styles.foundMeta}
                  >
                    <span
                      className={styles.foundName}
                    >
                      {lookup.fullName ||
                        "Your partner"}
                    </span>

                    <span
                      className={styles.foundHint}
                    >
                      Ready to pair — you'll share
                      one story.
                    </span>
                  </div>

                  <Button
                    onClick={handlePair}
                    disabled={pairing}
                  >
                    {pairing
                      ? "Pairing…"
                      : "Pair with them"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className={styles.codeTitle}>
                Your partner code
              </p>

              {codeLoading ? (
                <p className={styles.hint}>
                  Preparing your code…
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.codeValue}
                    onClick={handleCopyCode}
                    aria-label={`Copy partner code ${myCode}`}
                  >
                    {myCode ?? "— — — — — —"}
                  </button>

                  <p className={styles.codeHint}>
                    {copied
                      ? "Copied! Send it to your partner."
                    : "Tap the code to copy it — share it any way you like."}
                    {!copied && codeExpiry && (
                      <>
                        {" "}Valid until{" "}
                        {new Date(
                          codeExpiry
                        ).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        .
                      </>
                    )}
                  </p>

                  <div
                    className={styles.codeActions}
                  >
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setEnterCodeMode(true)
                      }
                    >
                      Have a code?
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={
                        handleRegenerateCode
                      }
                      disabled={regenerating}
                    >
                      {regenerating
                        ? "Making…"
                        : "New code"}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

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

      <PartnerProfileModal
        member={partner}
        storyTitle={story?.title}
        open={viewProfile}
        onClose={() =>
          setViewProfile(false)
        }
      />
    </div>
  );
}

export default Partner;
