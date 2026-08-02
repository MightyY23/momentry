import styles from "./TableOfContents.module.css";

function TableOfContents({
  chapters,
  currentPage,
  onSelect,
}) {
  return (
    <div className={styles.container}>
      <h2>Contents</h2>

      {chapters.map((chapter, index) => (
        <button
          key={index}
          className={
            currentPage === index
              ? styles.active
              : styles.item
          }
          onClick={() => onSelect(index)}
        >
          <span>{index + 1}.</span>

          {chapter.title}
        </button>
      ))}
    </div>
  );
}

export default TableOfContents;