import CalendarDay from "../CalendarDay/CalendarDay";

import styles from "./CalendarGrid.module.css";

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function CalendarGrid({
  currentDate,
  moments,
  selectedDate,
  setSelectedDate,
  drawerOpen,
  setDrawerOpen,
}) {
  //---------------------------------------
  // Month Information
  //---------------------------------------

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  //---------------------------------------
  // Calendar Cells
  //---------------------------------------

  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  //---------------------------------------

  return (
    <section
      className={styles.calendar}
      aria-label="Calendar"
    >
      <div
        className={styles.weekdays}
        role="row"
      >
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className={styles.weekday}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div
        className={styles.grid}
        role="grid"
      >
        {cells.map((day, index) => (
          <CalendarDay
            key={index}
            day={day}
            currentDate={currentDate}
            moments={moments}
            selectedDate={selectedDate}
            setSelectedDate={
              setSelectedDate
            }
            drawerOpen={drawerOpen}
            setDrawerOpen={
              setDrawerOpen
            }
          />
        ))}
      </div>
    </section>
  );
}

export default CalendarGrid;