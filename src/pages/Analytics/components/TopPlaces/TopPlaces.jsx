import PlaceRow from "../PlaceRow/PlaceRow";

import styles from "./TopPlaces.module.css";

function TopPlaces({ moments }) {
  const counts = {};

  moments.forEach((moment) => {
    if (!moment.location) return;

    counts[moment.location] =
      (counts[moment.location] || 0) + 1;
  });

  const places = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const max =
    places.length > 0
      ? places[0][1]
      : 1;

  return (
    <div className={styles.card}>
      <h2>
        📍 Top Places
      </h2>

      {places.length === 0 ? (
        <p className={styles.empty}>
          No locations available.
        </p>
      ) : (
        <div className={styles.list}>
          {places.map(
            ([place, count], index) => (
              <PlaceRow
                key={place}
                rank={index}
                place={place}
                count={count}
                max={max}
                delay={index * 0.1}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default TopPlaces;