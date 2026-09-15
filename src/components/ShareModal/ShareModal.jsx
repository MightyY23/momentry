import { useEffect, useState } from "react";

import Modal from "../../ui/Modal/Modal";
import Button from "../../ui/Button/Button";
import ConfirmDialog from "../../ui/ConfirmDialog/ConfirmDialog";

import { createShare } from "../../services/share/createShare";
import { getStoryShares } from "../../services/share/getStoryShares";
import { updateShare } from "../../services/share/updateShare";
import { deleteShare } from "../../services/share/deleteShare";

import useNotification from "../../hooks/useNotification";

import styles from "./ShareModal.module.css";

const EXPIRY_OPTIONS = [
  { value: "", label: "Never expires" },
  { value: "1", label: "Expires in 1 day" },
  { value: "7", label: "Expires in 7 days" },
  { value: "30", label: "Expires in 30 days" },
];

function formatExpiry(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const expired = date.getTime() < Date.now();

  return {
    expired,
    label: expired
      ? `Expired ${date.toLocaleDateString()}`
      : `Expires ${date.toLocaleDateString()}`,
  };
}

function ShareModal({
  open,
  onClose,
  story,
}) {
  const notify = useNotification();

  const [shares, setShares] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [revokingId, setRevokingId] =
    useState(null);

  const [confirmRevoke, setConfirmRevoke] =
    useState(null);

  // --- create form state ---

  const [expiry, setExpiry] = useState("");

  const [protect, setProtect] =
    useState(false);

  const [sharePassword,
    setSharePassword] = useState("");

  const [includeLocations,
    setIncludeLocations] = useState(true);

  //---------------------------------------
  // Load existing shares when opened
  //---------------------------------------

  useEffect(() => {
    if (!open || !story?.id) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const data =
          await getStoryShares(
            story.id
          );

        if (cancelled) return;

        setShares(data);

        setLoading(false);
      } catch (err) {
        console.error(
          "Failed to load shares:",
          err
        );

        if (cancelled) return;

        notify.error(
          "Couldn't load share links",
          "Please try again."
        );

        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // notify is stable in the provider
    // (useCallback with empty deps).
  }, [open, story?.id, notify]);

  //---------------------------------------
  // Create new share link
  //---------------------------------------

  async function handleCreate() {
    if (!story?.id) return;

    if (protect && sharePassword.trim().length < 4) {
      notify.error(
        "Password too short",
        "Use at least 4 characters."
      );

      return;
    }

    try {
      setCreating(true);

      const expiresAt = expiry
        ? new Date(
            Date.now() +
              Number(expiry) * 24 * 60 * 60 * 1000
          ).toISOString()
        : null;

      await createShare(story.id, {
        password: protect
          ? sharePassword.trim()
          : null,
        expiresAt,
        includeLocations,
      });

      const data =
        await getStoryShares(
          story.id
        );

      setShares(data);

      setExpiry("");

      setProtect(false);

      setSharePassword("");

      setIncludeLocations(true);

      notify.success(
        "Share link created!",
        protect
          ? "Only people with the password can read your story."
          : "Anyone with the link can read your story."
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't create share link",
        err.message ||
          "Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  //---------------------------------------
  // Toggle public / private
  //---------------------------------------

  async function handleTogglePublic(share) {
    try {
      await updateShare(share.id, {
        isPublic: !share.is_public,
      });

      setShares((prev) =>
        prev.map((s) =>
          s.id === share.id
            ? { ...s, is_public: !s.is_public }
            : s
        )
      );

      notify.success(
        share.is_public
          ? "Link set to private"
          : "Link is public again",
        share.is_public
          ? "Only you can use it now."
          : "Anyone with the link can read the story."
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't update link",
        err.message || "Please try again."
      );
    }
  }

  //---------------------------------------
  // Copy link
  //---------------------------------------

  async function handleCopy(code) {
    const url = `${window.location.origin}/share/${code}`;

    try {
      await navigator.clipboard.writeText(
        url
      );

      notify.success(
        "Link copied!",
        url
      );
    } catch {
      // Clipboard can fail on http or
      // older browsers — fall back.
      window.prompt(
        "Copy this link:",
        url
      );
    }
  }

  //---------------------------------------
  // Revoke share
  //---------------------------------------

  async function handleRevoke(id) {
    try {
      setRevokingId(id);

      await deleteShare(id);

      setShares((prev) =>
        prev.filter((s) => s.id !== id)
      );

      notify.success(
        "Share link revoked",
        "The link no longer works."
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't revoke link",
        err.message ||
          "Please try again."
      );
    } finally {
      setRevokingId(null);

      setConfirmRevoke(null);
    }
  }

  //---------------------------------------
  // UI
  //---------------------------------------

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Share your Story"
        subtitle="Create a read-only link anyone can open — no account needed."
        elevated
      >
        <div className={styles.createForm}>
          <Button
            onClick={handleCreate}
            loading={creating}
            leftIcon="🔗"
          >
            Create Share Link
          </Button>

          <div className={styles.options}>
            <label className={styles.option}>
              <span>Link expiry</span>

              <select
                value={expiry}
                onChange={(e) =>
                  setExpiry(e.target.value)
                }
              >
                {EXPIRY_OPTIONS.map(
                  (opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label
              className={styles.optionToggle}
            >
              <input
                type="checkbox"
                checked={protect}
                onChange={(e) => {
                  setProtect(
                    e.target.checked
                  );

                  if (
                    !e.target.checked
                  ) {
                    setSharePassword(
                      ""
                    );
                  }
                }}
              />

              <span>
                Protect with a password
              </span>
            </label>

            {protect && (
              <input
                type="text"
                className={styles.passwordInput}
                placeholder="Choose a password (min 4 characters)"
                value={sharePassword}
                onChange={(e) =>
                  setSharePassword(
                    e.target.value
                  )
                }
                autoComplete="off"
                aria-label="Share password"
              />
            )}

            <label
              className={styles.optionToggle}
            >
              <input
                type="checkbox"
                checked={includeLocations}
                onChange={(e) =>
                  setIncludeLocations(
                    e.target.checked
                  )
                }
              />

              <span>
                Show memory locations
              </span>
            </label>
          </div>
        </div>

        <div className={styles.list}>
          {loading ? (
            <p className={styles.hint}>
              Loading links…
            </p>
          ) : shares.length === 0 ? (
            <p className={styles.hint}>
              No share links yet. Create
              one above and send it to
              anyone you like.
            </p>
          ) : (
            shares.map((share) => {
              const expiryInfo =
                formatExpiry(
                  share.expires_at
                );

              return (
                <div
                  key={share.id}
                  className={
                    styles.shareItem
                  }
                >
                  <div
                    className={
                      styles.shareInfo
                    }
                  >
                    <code
                      className={
                        styles.code
                      }
                    >
                      {
                        share.share_code
                      }
                    </code>

                    <div
                      className={
                        styles.badges
                      }
                    >
                      {!share.is_public && (
                        <span
                          className={
                            styles.badgePrivate
                          }
                        >
                          Private
                        </span>
                      )}

                      {share.is_protected && (
                        <span
                          className={
                            styles.badgeLock
                          }
                        >
                          🔒 Password
                        </span>
                      )}

                      {share.is_protected &&
                        share.include_locations === false && (
                          <span
                            className={
                              styles.badgeExpiry
                            }
                          >
                            Locations hidden
                          </span>
                        )}

                      {expiryInfo && (
                        <span
                          className={
                            expiryInfo.expired
                              ? styles.badgeExpired
                              : styles.badgeExpiry
                          }
                        >
                          {expiryInfo.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={
                      styles.actions
                    }
                  >
                    <button
                      className={
                        styles.copy
                      }
                      onClick={() =>
                        handleCopy(
                          share.share_code
                        )
                      }
                    >
                      Copy Link
                    </button>

                    <button
                      className={
                        styles.toggle
                      }
                      onClick={() =>
                        handleTogglePublic(
                          share
                        )
                      }
                    >
                      {share.is_public
                        ? "Make Private"
                        : "Make Public"}
                    </button>

                    <button
                      className={
                        styles.revoke
                      }
                      disabled={
                        revokingId ===
                        share.id
                      }
                      onClick={() =>
                        setConfirmRevoke(
                          share
                        )
                      }
                    >
                      {revokingId ===
                      share.id
                        ? "Revoking…"
                        : "Revoke"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className={styles.footnote}>
          🔒 Readers see your story and
          memories only — never your
          account, collaborators, or private
          details. You can revoke any link
          at any time.
        </p>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmRevoke)}
        title="Revoke this share link?"
        message={`Anyone with the link "${confirmRevoke?.share_code || ""}" will immediately lose access. This can't be undone.`}
        confirmLabel="Revoke Link"
        danger
        elevated
        loading={revokingId !== null}
        onConfirm={() =>
          handleRevoke(confirmRevoke.id)
        }
        onCancel={() =>
          setConfirmRevoke(null)
        }
      />
    </>
  );
}

export default ShareModal;
