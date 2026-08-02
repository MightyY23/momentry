import styles from "./ExportPDFButton.module.css";

function ExportPDFButton({
  onExport,
}) {
  return (
    <button
      className={styles.button}
      onClick={onExport}
    >
      📄 Export Memory Book
    </button>
  );
}

export default ExportPDFButton;