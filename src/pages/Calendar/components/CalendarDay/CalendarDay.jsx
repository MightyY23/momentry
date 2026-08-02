import styles from "./CalendarDay.module.css";

function CalendarDay({
  day,
  currentDate,
  moments,
  selectedDate,
  setSelectedDate,
  setDrawerOpen,
}) {
  //---------------------------------------
  // Empty Cell
  //---------------------------------------

  if (!day) {
    return <div className={styles.empty} />;
  }

  //---------------------------------------
  // Dates
  //---------------------------------------

  const today = new Date();

  const currentDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    day
  );

  const isToday =
    today.getDate() === day &&
    today.getMonth() === currentDate.getMonth() &&
    today.getFullYear() === currentDate.getFullYear();

  const isSelected =
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() ===
      currentDate.getMonth() &&
    selectedDate.getFullYear() ===
      currentDate.getFullYear();

  //---------------------------------------
  // Memories
  //---------------------------------------

  const dayMemories = moments.filter(
    (moment) => {
      if (!moment.memory_date)
        return false;

      const date = new Date(
        moment.memory_date
      );

      return (
        date.getDate() === day &&
        date.getMonth() ===
          currentDate.getMonth() &&
        date.getFullYear() ===
          currentDate.getFullYear()
      );
    }
  );

  const memoryCount =
    dayMemories.length;

  const favoriteCount =
    dayMemories.filter(
      (memory) => memory.is_favorite
    ).length;

  const photoCount =
    dayMemories.filter(
      (memory) => memory.image_url
    ).length;

  //---------------------------------------
  // Click
  //---------------------------------------

  function handleClick() {
    setSelectedDate(currentDay);
    setDrawerOpen(true);
  }

  //---------------------------------------

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        ${styles.day}
        ${
          isToday
            ? styles.today
            : ""
        }
        ${
          isSelected
            ? styles.selected
            : ""
        }
      `}
    >
      <div className={styles.header}>
        <span className={styles.number}>
          {day}
        </span>

        {favoriteCount > 0 && (
          <span
            className={
              styles.favoriteBadge
            }
          >
            ❤️
          </span>
        )}
      </div>

      <div className={styles.content}>
        {memoryCount > 0 ? (
          <>
            <div
              className={
                styles.memoryCount
              }
            >
              {memoryCount}{" "}
              {memoryCount === 1
                ? "Memory"
                : "Memories"}
            </div>

            <div
              className={
                styles.badges
              }
            >
              {photoCount > 0 && (
                <span
                  className={
                    styles.photo
                  }
                >
                  📷 {photoCount}
                </span>
              )}

              {favoriteCount > 0 && (
                <span
                  className={
                    styles.favorite
                  }
                >
                  ❤️ {favoriteCount}
                </span>
              )}
            </div>
          </>
        ) : (
          <div
            className={
              styles.emptyState
            }
          >
            No memories
          </div>
        )}
      </div>
    </button>
  );
}

export default CalendarDay;