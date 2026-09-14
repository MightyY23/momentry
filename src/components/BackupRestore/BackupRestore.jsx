import { useRef, useState } from "react";

import ConfirmDialog from "../../ui/ConfirmDialog/ConfirmDialog";

import styles from "./BackupRestore.module.css";

function BackupRestore({
  onExport,
  onRestore,
}) {
  const fileInputRef = useRef(null);

  // File chosen, awaiting confirmation.
  const [pendingFile, setPendingFile] =
    useState(null);

  const [restoring, setRestoring] =
    useState(false);

  //---------------------------------------

  function handleFile(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setPendingFile(file);

    // Allow re-selecting the same file.
    event.target.value = "";
  }

  async function handleConfirmRestore() {
    if (!pendingFile) return;

    try {
      setRestoring(true);

      await onRestore(pendingFile);

      setPendingFile(null);
    } finally {
      setRestoring(false);
    }
  }

  //---------------------------------------

  return (
    <div className={styles.card}>
      <h2>
        📦 Backup & Restore
      </h2>

      <button
        onClick={onExport}
      >
        📤 Export Backup
      </button>

      <label
        className={
          styles.restore
        }
      >
        📥 Restore Backup

        <input
          type="file"
          accept=".json"
          hidden
          ref={fileInputRef}
          onChange={
            handleFile
          }
        />
      </label>

      <ConfirmDialog
        open={!!pendingFile}
        title="Restore this backup?"
        message="Existing memories with the same IDs will be updated, and new memories from the file will be added. Your current data is not deleted."
        confirmLabel="Restore"
        cancelLabel="Cancel"
        loading={restoring}
        onConfirm={
          handleConfirmRestore
        }
        onCancel={() =>
          setPendingFile(null)
        }
      />
    </div>
  );
}

export default BackupRestore;
