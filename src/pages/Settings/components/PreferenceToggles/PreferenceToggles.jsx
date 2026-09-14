import { useState } from "react";

import {
  getPreferences,
  updatePreference,
} from "../../../../services/preferences/preferences";

import styles from "./PreferenceToggles.module.css";

/**
 * Renders a list of labelled switches
 * backed by the local preferences store.
 *
 * <PreferenceToggles
 *   section="notifications"
 *   items={[
 *     { key: "storyInvitations", label: "Story invitations", hint: "…" },
 *   ]}
 *   note="Saved on this device."
 * />
 */
function PreferenceToggles({
  section,
  items,
  note,
}) {
  // Lazily initialize from the local
  // preferences store on first render.
  const [prefs, setPrefs] =
    useState(getPreferences);

  function handleToggle(key, value) {
    setPrefs(
      updatePreference(
        section,
        key,
        value
      )
    );
  }

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <div
          key={item.key}
          className={styles.row}
        >
          <div className={styles.text}>
            <span
              className={styles.label}
            >
              {item.label}
            </span>

            {item.hint && (
              <span
                className={styles.hint}
              >
                {item.hint}
              </span>
            )}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={
              prefs[section]?.[item.key] ??
              false
            }
            aria-label={item.label}
            className={`${styles.switch} ${
              prefs[section]?.[item.key]
                ? styles.on
                : ""
            }`}
            onClick={() =>
              handleToggle(
                item.key,
                !prefs[section]?.[item.key]
              )
            }
          >
            <span
              className={styles.knob}
            />
          </button>
        </div>
      ))}

      {note && (
        <p className={styles.note}>
          {note}
        </p>
      )}
    </div>
  );
}

export default PreferenceToggles;
