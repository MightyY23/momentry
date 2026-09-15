import { useRef, useState } from "react";

import Modal from "../../ui/Modal/Modal";
import Button from "../../ui/Button/Button";

import { supabase } from "../../services/supabase/supabaseClient";
import { updateProfile } from "../../services/profile/updateProfile";
import {
  uploadAvatar,
  removeAvatar,
} from "../../services/profile/avatar";
import { validateImageFile } from "../../services/storage/uploadImage";

import useNotification from "../../hooks/useNotification";

import styles from "./EditProfileModal.module.css";

function EditProfileModal({
  open,
  onClose,
  user,
  profile,
  onSaved,
}) {
  const notify = useNotification();

  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(
    profile?.full_name ||
      user?.user_metadata?.full_name ||
      ""
  );

  // Birthday (powers the partner reminder).
  const [birthDate, setBirthDate] = useState(
    profile?.birth_date || ""
  );

  // Avatar URL currently saved on the profile
  // (or freshly uploaded in this session).
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_url || ""
  );

  const [uploading, setUploading] =
    useState(false);

  const [removing, setRemoving] =
    useState(false);

  const [saving, setSaving] = useState(false);

  //---------------------------------------
  // Avatar: replace
  //---------------------------------------

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    // Client-side validation with clear
    // feedback (also enforced in the service).
    const validationError =
      validateImageFile(file);

    if (validationError) {
      notify.error(
        "Invalid image",
        validationError
      );

      e.target.value = "";

      return;
    }

    try {
      setUploading(true);

      const url = await uploadAvatar(
        file,
        avatarUrl || null
      );

      setAvatarUrl(url);

      notify.success(
        "Photo ready",
        "Save changes to apply your new avatar."
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't upload avatar",
        err.message || "Please try a different image."
      );
    } finally {
      setUploading(false);

      e.target.value = "";
    }
  }

  //---------------------------------------
  // Avatar: remove
  //---------------------------------------

  async function handleRemoveAvatar() {
    try {
      setRemoving(true);

      await removeAvatar(avatarUrl);

      setAvatarUrl("");

      notify.success(
        "Photo removed",
        "Save changes to apply."
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't remove avatar",
        "Please try again."
      );
    } finally {
      setRemoving(false);
    }
  }

  //---------------------------------------
  // Save
  //---------------------------------------

  async function handleSave() {
    if (!user?.id) return;

    const trimmedName = fullName.trim();

    if (trimmedName.length > 60) {
      notify.error(
        "Name too long",
        "Keep your display name under 60 characters."
      );
      return;
    }

    if (
      birthDate &&
      new Date(birthDate) > new Date()
    ) {
      notify.error(
        "Invalid birthday",
        "Birthdays can't be in the future."
      );
      return;
    }

    try {
      setSaving(true);

      await updateProfile(user.id, {
        fullName: trimmedName,
        avatarUrl,
        birthDate: birthDate || null,
      });

      // Keep auth metadata in sync so the
      // name shows up even without a profile row.
      await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
        },
      });

      notify.success(
        "Profile updated!",
        "Your changes are live."
      );

      onSaved?.();

      onClose();
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't update profile",
        err.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  //---------------------------------------
  // UI
  //---------------------------------------

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profile"
      subtitle="How you appear across Momentry."
    >
      <div className={styles.body}>
        <div className={styles.avatarSection}>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading || removing}
            aria-label="Change avatar"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Current avatar"
              />
            ) : (
              <span>
                {(
                  fullName ||
                  user?.email ||
                  "?"
                )
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}

            <span className={styles.avatarBadge}>
              {uploading ? "…" : "📷"}
            </span>
          </button>

          <p className={styles.avatarHint}>
            {uploading
              ? "Uploading…"
              : "Click the photo to change it"}
          </p>

          {avatarUrl && (
            <Button
              variant="secondary"
              size="sm"
              loading={removing}
              onClick={
                handleRemoveAvatar
              }
            >
              Remove Photo
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
            hidden
            onChange={
              handleAvatarChange
            }
          />
        </div>

        <label className={styles.field}>
          <span>Display name</span>

          <input
            type="text"
            placeholder="Your name"
            value={fullName}
            maxLength={60}
            onChange={(e) =>
              setFullName(e.target.value)
            }
          />
        </label>

        <label className={styles.field}>
          <span>Birthday</span>

          <input
            type="date"
            value={birthDate || ""}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) =>
              setBirthDate(e.target.value)
            }
          />

          <small className={styles.fieldHint}>
            Used to remind your partner to
            celebrate you 🎂
          </small>
        </label>

        <label className={styles.field}>
          <span>Email</span>

          <input
            type="email"
            value={user?.email || ""}
            disabled
            readOnly
          />
        </label>

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
      </div>
    </Modal>
  );
}

export default EditProfileModal;
