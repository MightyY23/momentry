import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Modal from "../../ui/Modal/Modal";
import Button from "../../ui/Button/Button";
import ConfirmDialog from "../../ui/ConfirmDialog/ConfirmDialog";
import ShareModal from "../ShareModal/ShareModal";

import { updateStory } from "../../services/story/updateStory";
import { deleteStory } from "../../services/story/deleteStory";
import { uploadImage } from "../../services/storage/uploadImage";
import {
  getStoryMembers,
  removeStoryMember,
  updateMemberRole,
} from "../../services/story/members";
import { supabase } from "../../services/supabase/supabaseClient";

import useMoments from "../../hooks/useMoments";
import useNotification from "../../hooks/useNotification";

import styles from "./StorySettingsModal.module.css";

function StorySettingsModal({
  open,
  onClose,
  story,
}) {
  const navigate = useNavigate();

  const { refresh } = useMoments();
  const notify = useNotification();

  const fileInputRef = useRef(null);

  //---------------------------------------
  // General state
  //---------------------------------------

  const [title, setTitle] = useState(
    story?.title ?? ""
  );

  const [coverPhoto, setCoverPhoto] =
    useState(story?.cover_photo ?? "");

  const [uploading, setUploading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [confirmingDelete, setConfirmingDelete] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [sharingOpen, setSharingOpen] =
    useState(false);

  // Reset the editable fields whenever a
  // (different) story is loaded or the modal
  // re-opens — replaces the old setState-in-
  // effect pattern, which cascaded renders.
  const [syncedStory, setSyncedStory] =
    useState(null);

  if (
    open &&
    story &&
    syncedStory !== story
  ) {
    setSyncedStory(story);

    setTitle(story.title ?? "");

    setCoverPhoto(story.cover_photo ?? "");
  }

  //---------------------------------------
  // Members state
  //---------------------------------------

  const [members, setMembers] = useState([]);

  const [membersLoading,
    setMembersLoading] = useState(false);

  const [isOwner, setIsOwner] =
    useState(false);

  const [removingMemberId,
    setRemovingMemberId] = useState(null);

  const [memberBusy, setMemberBusy] =
    useState(false);

  const loadMembers =
    useCallback(async () => {
      if (!story?.id || !open) return;

      try {
        setMembersLoading(true);

        const data =
          await getStoryMembers(story.id);

        setMembers(data);

        // Am I the owner?
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setIsOwner(
          data.some(
            (m) =>
              m.user_id === user?.id &&
              m.role === "owner"
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        setMembersLoading(false);
      }
    }, [story, open]);

  useEffect(() => {
    if (open) {
      // Async data fetch — the loading/error
      // setState calls happen in the async
      // continuation, not the effect body.
      const timer = setTimeout(
        loadMembers,
        0
      );

      return () =>
        clearTimeout(timer);
    }
  }, [open, loadMembers]);

  //---------------------------------------
  // Cover upload
  //---------------------------------------

  async function handleCoverChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const url = await uploadImage(
        file
      );

      setCoverPhoto(url);

      notify.success(
        "Cover ready",
        "Save changes to apply your new cover."
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't upload cover",
        err.message
      );
    } finally {
      setUploading(false);
    }
  }

  //---------------------------------------
  // Save title + cover
  //---------------------------------------

  async function handleSave() {
    if (!story?.id) return;

    if (!title.trim()) {
      notify.error(
        "Missing title",
        "Your story needs a title."
      );
      return;
    }

    // Code-point length: emoji count as one.
    if ([...title.trim()].length > 120) {
      notify.error(
        "Title too long",
        "Keep the title under 120 characters."
      );
      return;
    }

    try {
      setSaving(true);

      await updateStory(story.id, {
        title: title.trim(),
        cover_photo: coverPhoto,
      });

      await refresh();

      notify.success(
        "Story updated!",
        "Your changes are live."
      );

      onClose();
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't update story",
        err.message
      );
    } finally {
      setSaving(false);
    }
  }

  //---------------------------------------
  // Member actions (owner-only)
  //---------------------------------------

  async function handleRoleChange(
    memberId,
    newRole
  ) {
    try {
      setMemberBusy(true);

      await updateMemberRole(
        memberId,
        newRole
      );

      notify.success(
        "Role updated",
        "The member's role has changed."
      );

      await loadMembers();
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't update role",
        err.message ||
          "Only the story owner can manage roles."
      );
    } finally {
      setMemberBusy(false);
    }
  }

  async function handleRemoveMember() {
    if (!removingMemberId) return;

    try {
      setMemberBusy(true);

      await removeStoryMember(
        removingMemberId
      );

      setRemovingMemberId(null);

      notify.success(
        "Member removed",
        "They no longer have access to this story."
      );

      await loadMembers();
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't remove member",
        err.message ||
          "Only the story owner can remove members."
      );
    } finally {
      setMemberBusy(false);
    }
  }

  //---------------------------------------
  // Delete story
  //---------------------------------------

  async function handleDelete() {
    if (!story?.id) return;

    try {
      setDeleting(true);

      await deleteStory(story.id);

      notify.success(
        "Story deleted",
        "Take your time — you can start fresh whenever you're ready."
      );

      navigate("/create-story");
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't delete story",
        err.message
      );

      setDeleting(false);
    }
  }

  //---------------------------------------
  // UI
  //---------------------------------------

  const removedMember = members.find(
    (m) => m.id === removingMemberId
  );

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Story Settings"
        subtitle="Update your story, manage members, or delete it."
      >
        <label className={styles.label}>
          Story title
        </label>

        <input
          className={styles.input}
          type="text"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Our Story"
        />

        <label className={styles.label}>
          Cover photo
        </label>

        <div className={styles.coverRow}>
          {coverPhoto ? (
            <img
              src={coverPhoto}
              alt="Cover preview"
              className={styles.coverPreview}
            />
          ) : (
            <div
              className={`${styles.coverPreview} ${styles.coverPlaceholder}`}
            >
              📖
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
            hidden
            onChange={
              handleCoverChange
            }
          />

          <Button
            variant="secondary"
            size="sm"
            loading={uploading}
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            {coverPhoto
              ? "Replace"
              : "Upload"}
          </Button>
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            loading={saving}
          >
            Save Changes
          </Button>
        </div>

        {/* ------- Members ------- */}

        <div className={styles.membersSection}>
          <h3>
            Members
          </h3>

          {membersLoading ? (
            <p className={styles.membersHint}>
              Loading members…
            </p>
          ) : members.length === 0 ? (
            <p className={styles.membersHint}>
              No members yet.
            </p>
          ) : (
            <ul className={styles.membersList}>
              {members.map(
                (member) => (
                  <li
                    key={member.id}
                  >
                    <div
                      className={
                        styles.memberInfo
                      }
                    >
                      <span
                        className={
                          styles.memberAvatar
                        }
                      >
                        {member.profiles?.avatar_url ? (
                          <img
                            src={
                              member.profiles.avatar_url
                            }
                            alt=""
                          />
                        ) : (
                          (
                            member.profiles
                              ?.full_name ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </span>

                      <span
                        className={
                          styles.memberName
                        }
                      >
                        {member.profiles
                          ?.full_name ||
                          "Member"}

                        <em>
                          {member.role}
                        </em>
                      </span>
                    </div>

                    {isOwner &&
                      member.role !==
                        "owner" && (
                        <div
                          className={
                            styles.memberActions
                          }
                        >
                          <select
                            className={
                              styles.roleSelect
                            }
                            value={
                              member.role
                            }
                            disabled={
                              memberBusy
                            }
                            onChange={(
                              e
                            ) =>
                              handleRoleChange(
                                member.id,
                                e
                                  .target
                                  .value
                              )
                            }
                            aria-label={`Change role for ${member.profiles?.full_name || "member"}`}
                          >
                            <option value="editor">
                              Editor
                            </option>

                            <option value="viewer">
                              Viewer
                            </option>
                          </select>

                          <button
                            className={
                              styles.removeButton
                            }
                            onClick={() =>
                              setRemovingMemberId(
                                member.id
                              )
                            }
                            aria-label="Remove member"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                  </li>
                )
              )}
            </ul>
          )}

          {!isOwner && (
            <p className={styles.membersHint}>
              Only the story owner can manage
              members.
            </p>
          )}
        </div>

        {/* ------- Sharing (owner only) ------- */}

        {isOwner && (
          <div className={styles.shareSection}>
            <div>
              <strong>Sharing</strong>

              <span>
                Create a read-only link anyone can open —
                revoke it any time.
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setSharingOpen(true)
              }
            >
              Manage Links
            </Button>
          </div>
        )}

        {/* ------- Danger zone ------- */}

        <div className={styles.dangerZone}>
          <div>
            <strong>Danger zone</strong>

            <span>
              Deleting your story removes
              everything in it.
            </span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              setConfirmingDelete(true)
            }
          >
            Delete Story
          </Button>
        </div>
      </Modal>

      {/* ------- Sharing (layers above the sheet) ------- */}

      <ShareModal
        open={sharingOpen}
        onClose={() =>
          setSharingOpen(false)
        }
        story={story}
      />

      {/* ------- Confirmations ------- */}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this Story?"
        message={`Deleting ${story?.title || "this story"} permanently removes the story and all of its memories — photos, dates and places included.`}
        confirmLabel="Delete Forever"
        cancelLabel="Keep My Story"
        danger
        loading={deleting}
        onConfirm={
          handleDelete
        }
        onCancel={() =>
          setConfirmingDelete(false)
        }
      />

      <ConfirmDialog
        open={!!removingMemberId}
        title="Remove this member?"
        message={`${removedMember?.profiles?.full_name || "This member"} will lose access to "${story?.title || "this story"}". You can invite them again later.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        danger
        loading={memberBusy}
        onConfirm={
          handleRemoveMember
        }
        onCancel={() =>
          setRemovingMemberId(null)
        }
      />
    </>
  );
}

export default StorySettingsModal;
