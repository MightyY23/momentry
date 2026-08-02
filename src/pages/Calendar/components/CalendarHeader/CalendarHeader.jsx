import styles from "./CalendarHeader.module.css";

function CalendarHeader({
  currentDate,
  setCurrentDate,
  moments,
}) {
  //---------------------------------------
  // Navigation
  //---------------------------------------

  function previousMonth() {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function changeYear(e) {
    setCurrentDate(
      new Date(
        Number(e.target.value),
        currentDate.getMonth(),
        1
      )
    );
  }

  //---------------------------------------
  // Years
  //---------------------------------------

  const currentYear = new Date().getFullYear();

  const years = [];

  for (
    let year = currentYear - 10;
    year <= currentYear + 5;
    year++
  ) {
    years.push(year);
  }

  //---------------------------------------
  // Monthly Statistics
  //---------------------------------------

  const monthlyMoments = moments.filter(
    (moment) => {
      if (!moment.memory_date) return false;

      const date = new Date(
        moment.memory_date
      );

      return (
        date.getMonth() ===
          currentDate.getMonth() &&
        date.getFullYear() ===
          currentDate.getFullYear()
      );
    }
  );

  const favorites =
    monthlyMoments.filter(
      (moment) => moment.is_favorite
    ).length;

  const photos =
    monthlyMoments.filter(
      (moment) => moment.image_url
    ).length;

  //---------------------------------------

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <button
          onClick={previousMonth}
          className={styles.arrow}
          aria-label="Previous Month"
        >
          ←
        </button>

        <div className={styles.title}>
          <h1>
            {currentDate.toLocaleString(
              "default",
              {
                month: "long",
                year: "numeric",
              }
            )}
          </h1>

          <p>
            Relive every beautiful
            memory.
          </p>
        </div>

        <button
          onClick={nextMonth}
          className={styles.arrow}
          aria-label="Next Month"
        >
          →
        </button>
      </div>

      <div className={styles.bottom}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>📅</span>
            <strong>
              {monthlyMoments.length}
            </strong>
            <small>Memories</small>
          </div>

          <div className={styles.stat}>
            <span>❤️</span>
            <strong>{favorites}</strong>
            <small>Favorites</small>
          </div>

          <div className={styles.stat}>
            <span>📷</span>
            <strong>{photos}</strong>
            <small>Photos</small>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.today}
            onClick={goToToday}
          >
            📅 Today
          </button>

          <select
            value={currentDate.getFullYear()}
            onChange={changeYear}
          >
            {years.map((year) => (
              <option
                key={year}
                value={year}
              >
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

export default CalendarHeader;