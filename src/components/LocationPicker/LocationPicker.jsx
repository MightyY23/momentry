import {
  useEffect,
  useRef,
  useState,
} from "react";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { searchPlaces, reverseGeocode } from "../../services/map/placeSearch";

import Button from "../../ui/Button/Button";

import styles from "./LocationPicker.module.css";

function ClickCatcher({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}

/**
 * A location input with:
 *  - live suggestions while typing
 *  - a "pick on map" modal
 *
 * value: { label, lat, lng } | null
 */
function LocationPicker({
  value,
  onChange,
  placeholder = "Where did this happen?",
}) {
  const [text, setText] = useState(
    value?.label || ""
  );

  const [suggestions, setSuggestions] =
    useState([]);

  const [open, setOpen] = useState(false);

  const [searching, setSearching] =
    useState(false);

  const [mapOpen, setMapOpen] = useState(false);

  const [pending, setPending] = useState(null);

  const [resolving, setResolving] =
    useState(false);

  const debounceRef = useRef(null);

  const boxRef = useRef(null);

  //---------------------------------------
  // Debounced suggestions
  //---------------------------------------

  function handleType(e) {
    const next = e.target.value;

    setText(next);

    onChange?.(null);

    clearTimeout(debounceRef.current);

    if (next.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);

      return;
    }

    debounceRef.current = setTimeout(
      async () => {
        setSearching(true);

        const results = await searchPlaces(
          next
        );

        setSuggestions(results);

        setOpen(results.length > 0);

        setSearching(false);
      },
      400
    );
  }

  function pickSuggestion(s) {
    setText(s.label);

    setOpen(false);

    onChange?.({
      label: s.label,
      lat: s.lat,
      lng: s.lng,
    });
  }

  //---------------------------------------
  // Click-outside closes suggestions
  //---------------------------------------

  useEffect(() => {
    function onDocClick(e) {
      if (
        boxRef.current &&
        !boxRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      onDocClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        onDocClick
      );
  }, []);

  //---------------------------------------
  // Map picking
  //---------------------------------------

  async function handleMapPick(latlng) {
    setPending(latlng);
  }

  async function confirmMapPick() {
    if (!pending) return;

    try {
      setResolving(true);

      const label = await reverseGeocode(
        pending[0],
        pending[1]
      );

      onChange?.({
        label:
          label ||
          `${pending[0].toFixed(4)}, ${pending[1].toFixed(4)}`,
        lat: pending[0],
        lng: pending[1],
      });

      setText(
        label ||
          `${pending[0].toFixed(4)}, ${pending[1].toFixed(4)}`
      );

      setMapOpen(false);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      className={styles.wrapper}
      ref={boxRef}
    >
      <div className={styles.row}>
        <input
          className={styles.input}
          type="text"
          value={text}
          onChange={handleType}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Location"
        />

        <Button
          variant="secondary"
          className={styles.mapBtn}
          onClick={() => setMapOpen(true)}
          aria-label="Pick location on map"
        >
          🗺️
        </Button>
      </div>

      {open && (
        <ul
          className={styles.suggestions}
          role="listbox"
        >
          {searching && (
            <li
              className={styles.suggestion}
              aria-live="polite"
            >
              Searching…
            </li>
          )}

          {!searching &&
            suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={
                    styles.suggestion
                  }
                  onClick={() =>
                    pickSuggestion(s)
                  }
                >
                  📍 {s.label}
                </button>
              </li>
            ))}
        </ul>
      )}

      {mapOpen && (
        <div
          className={styles.mapModal}
          role="dialog"
          aria-modal="true"
          aria-label="Pick a location on the map"
        >
          <div className={styles.mapModalBar}>
            <p className={styles.mapHint}>
              Tap the map to drop your pin
            </p>

            <div
              className={styles.mapModalActions}
            >
              <Button
                variant="secondary"
                onClick={() =>
                  setMapOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                onClick={confirmMapPick}
                disabled={!pending || resolving}
              >
                {resolving
                  ? "Resolving…"
                  : pending
                  ? "Use this place"
                  : "Pick a spot"}
              </Button>
            </div>
          </div>

          <div className={styles.mapWrap}>
            <MapContainer
              center={[
                value?.lat ?? 20,
                value?.lng ?? 0,
              ]}
              zoom={value?.lat ? 12 : 2}
              className={styles.leaflet}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <ClickCatcher
                onPick={handleMapPick}
              />

              {pending && (
                <Marker
                  position={pending}
                  icon={
                    window.L
                      ? new window.L.Icon({
                          iconUrl:
                            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                        })
                      : undefined
                  }
                />
              )}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
