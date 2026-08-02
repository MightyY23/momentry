import styles from "./CalendarFilters.module.css";

function CalendarFilters({
  search,
  setSearch,
  favoritesOnly,
  setFavoritesOnly,
  photosOnly,
  setPhotosOnly,
}) {
  const hasFilters =
    search ||
    favoritesOnly ||
    photosOnly;

  return (
    <section
      className={styles.container}
      aria-label="Calendar filters"
    >
      <div className={styles.searchWrapper}>
        <span
          className={styles.searchIcon}
          aria-hidden="true"
        >
          🔍
        </span>

        <input
          type="text"
          placeholder="Search memories..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className={styles.search}
          aria-label="Search memories"
        />
      </div>

      <div className={styles.filters}>
        <button
          type="button"
          className={`${styles.filterButton} ${
            favoritesOnly
              ? styles.active
              : ""
          }`}
          onClick={() =>
            setFavoritesOnly(
              !favoritesOnly
            )
          }
        >
          ❤️ Favorites
        </button>

        <button
          type="button"
          className={`${styles.filterButton} ${
            photosOnly
              ? styles.active
              : ""
          }`}
          onClick={() =>
            setPhotosOnly(
              !photosOnly
            )
          }
        >
          📷 Photos
        </button>

        <button
          type="button"
          className={styles.clear}
          disabled={!hasFilters}
          onClick={() => {
            setSearch("");
            setFavoritesOnly(false);
            setPhotosOnly(false);
          }}
        >
          🧹 Clear Filters
        </button>
      </div>
    </section>
  );
}

export default CalendarFilters;