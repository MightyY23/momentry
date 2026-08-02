import styles from "./BackupRestore.module.css";

function BackupRestore({
  onExport,
  onRestore,
}) {
  function handleFile(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const confirmed =
  window.confirm(
    "Restore this backup?\n\nExisting memories with the same ID will be updated."
  );

if (!confirmed) return;

onRestore(file);

    event.target.value = "";
  }

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
          onChange={
            handleFile
          }
        />
      </label>
    </div>
  );
}

export default BackupRestore;