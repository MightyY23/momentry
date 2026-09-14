import Modal from "../Modal/Modal";
import Button from "../Button/Button";

import styles from "./ConfirmDialog.module.css";

/**
 * Reusable confirmation dialog.
 *
 * <ConfirmDialog
 *   open={bool}
 *   title="Delete this memory?"
 *   message="This cannot be undone."
 *   confirmLabel="Delete"
 *   cancelLabel="Keep it"
 *   danger={bool}
 *   loading={bool}
 *   onConfirm={fn}
 *   onCancel={fn}
 * >
 *   optional extra content (e.g. a typed
 *   confirmation input)
 * </ConfirmDialog>
 */
function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={
        loading
          ? () => {}
          : onCancel
      }
      title={title}
      size="sm"
    >
      {message && (
        <p className={styles.message}>
          {message}
        </p>
      )}

      {children}

      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>

        <Button
          variant={
            danger
              ? "danger"
              : "primary"
          }
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
