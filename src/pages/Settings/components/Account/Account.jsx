import { useState } from "react";

import { supabase } from "../../../../services/supabase/supabaseClient";

import { useAuth } from "../../../../contexts/useAuth";

import Button from "../../../../ui/Button/Button";
import ConfirmDialog from "../../../../ui/ConfirmDialog/ConfirmDialog";

import { deleteAccount } from "../../../../services/account/deleteAccount";

import useNotification from "../../../../hooks/useNotification";

import styles from "./Account.module.css";

const PROVIDER_LABELS = {
  email: "Email & password",
  google: "Google",
  apple: "Apple",
  github: "GitHub",
};

function Account() {
  const notify = useNotification();

  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [saving, setSaving] = useState(false);

  // --- danger zone ---

  const [confirmDeleteOpen,
    setConfirmDeleteOpen] = useState(false);

  const [deleteConfirmText,
    setDeleteConfirmText] = useState("");

  const [deleting, setDeleting] = useState(false);

  const provider =
    user?.app_metadata?.provider || "email";

  const isPasswordProvider =
    user?.identities?.some(
      (identity) => identity.provider === "email"
    ) ?? provider === "email";

  //---------------------------------------
  // Change password
  //---------------------------------------

  async function handleChangePassword(e) {
    e.preventDefault();

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      notify.error(
        "Missing fields",
        "Fill in all three password fields."
      );
      return;
    }

    if (newPassword.length < 6) {
      notify.error(
        "Password too short",
        "Use at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      notify.error(
        "Passwords don't match",
        "Re-enter your new password."
      );
      return;
    }

    try {
      setSaving(true);

      // Verify the current password first by
      // re-authenticating.
      const {
        data: { user: fresh },
      } = await supabase.auth.getUser();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: fresh.email,
          password: currentPassword,
        });

      if (signInError) {
        notify.error(
          "Current password is incorrect",
          "Check it and try again."
        );
        return;
      }

      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (error) {
        notify.error(
          "Couldn't change password",
          error.message
        );
        return;
      }

      notify.success(
        "Password updated!",
        "Use your new password next time."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);

      notify.error(
        "Something went wrong",
        "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  //---------------------------------------
  // Sign out on all devices
  //---------------------------------------

  async function handleSignOutEverywhere() {
    try {
      await supabase.auth.signOut({
        scope: "others",
      });

      notify.success(
        "Signed out everywhere",
        "Other devices have been logged out."
      );
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't sign out other devices",
        err.message || "Please try again."
      );
    }
  }

  //---------------------------------------
  // Delete account
  //---------------------------------------

  async function handleDeleteAccount() {
    try {
      setDeleting(true);

      await deleteAccount();

      await supabase.auth.signOut();

      notify.success(
        "Account deleted",
        "All of your data has been removed."
      );

      window.location.href = "/";
    } catch (err) {
      console.error(err);

      notify.error(
        "Couldn't delete account",
        err.message ||
          "Please try again or contact support."
      );

      setDeleting(false);

      setConfirmDeleteOpen(false);
    }
  }

  //---------------------------------------
  // UI
  //---------------------------------------

  const email = user?.email || "";

  const deleteReady =
    deleteConfirmText.trim().toUpperCase() ===
    "DELETE";

  return (
    <div className={styles.wrapper}>
      {/* ---- Account info ---- */}

      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>
            Email
          </span>

          <span className={styles.infoValue}>
            {email || "—"}
          </span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>
            Sign-in method
          </span>

          <span className={styles.infoValue}>
            {PROVIDER_LABELS[provider] ||
              provider}
          </span>
        </div>
      </div>

      {/* ---- Password (email users only) ---- */}

      {isPasswordProvider ? (
        <form
          className={styles.form}
          onSubmit={handleChangePassword}
        >
          <p className={styles.hint}>
            Change the password you use to
            sign in to Momentry.
          </p>

          <label className={styles.field}>
            <span>Current password</span>

            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(
                  e.target.value
                )
              }
            />
          </label>

          <label className={styles.field}>
            <span>New password</span>

            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
            />
          </label>

          <label className={styles.field}>
            <span>Confirm new password</span>

            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />
          </label>

          <div
            className={styles.actions}
          >
            <Button
              type="submit"
              loading={saving}
            >
              Update Password
            </Button>

            <Button
              variant="secondary"
              type="button"
              onClick={
                handleSignOutEverywhere
              }
            >
              Sign out other devices
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            type="button"
            onClick={
              handleSignOutEverywhere
            }
          >
            Sign out other devices
          </Button>
        </div>
      )}

      {/* ---- Danger zone ---- */}

      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>
          ⚠️ Danger Zone
        </h3>

        <p className={styles.dangerText}>
          Permanently delete your account,
          stories, memories and photos. This
          action cannot be undone.
        </p>

        <button
          className={styles.deleteButton}
          onClick={() =>
            setConfirmDeleteOpen(true)
          }
        >
          Delete my account
        </button>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete your account?"
        message="This permanently removes your profile, stories, memories and photos. Type DELETE below to confirm."
        confirmLabel={deleting ? "Deleting…" : "Delete forever"}
        cancelLabel="Keep my account"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteReady) return;

          await handleDeleteAccount();
        }}
        onCancel={() => {
          if (deleting) return;

          setConfirmDeleteOpen(false);

          setDeleteConfirmText("");
        }}
      >
        <input
          className={styles.confirmInput}
          placeholder='Type "DELETE" to confirm'
          value={deleteConfirmText}
          onChange={(e) =>
            setDeleteConfirmText(
              e.target.value
            )
          }
          aria-label='Type DELETE to confirm'
          disabled={deleting}
        />
      </ConfirmDialog>
    </div>
  );
}

export default Account;
