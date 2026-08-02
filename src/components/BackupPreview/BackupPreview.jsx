import styles from "./BackupPreview.module.css";

function BackupPreview({
  backup,
  onCancel,
  onRestore,
}) {
  if (!backup) return null;

  const photos =
    backup.moments.filter(
      (m) => m.image_url
    ).length;

  const favorites =
    backup.moments.filter(
      (m) => m.is_favorite
    ).length;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>
          📦 Backup Preview
        </h2>

        <div className={styles.info}>
          <p>
            <strong>📅 Created:</strong>{" "}
            {new Date(
              backup.exportedAt
            ).toLocaleString()}
          </p>

          <p>
            <strong>❤️ Story:</strong>{" "}
            {backup.story?.title ||
              "Our Story"}
          </p>

          <p>
            <strong>📖 Memories:</strong>{" "}
            {backup.moments.length}
          </p>

          <p>
            <strong>📸 Photos:</strong>{" "}
            {photos}
          </p>

          <p>
            <strong>⭐ Favorites:</strong>{" "}
            {favorites}
          </p>

          <p>
            <strong>🏆 Achievements:</strong>{" "}
            {backup
              .achievements?.length ||
              0}
          </p>

          <p>
            <strong>⚙ Version:</strong>{" "}
            {backup.version}
          </p>
        </div>

        <div className={styles.actions}>
          <button
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className={styles.restore}
            onClick={onRestore}
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}

export default BackupPreview;