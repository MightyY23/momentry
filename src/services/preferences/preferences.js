/**
 * App preferences — stored locally for now.
 *
 * NOTE: Momentry has no server-side
 * preferences table yet, so these live in
 * localStorage under one versioned key.
 * When backend support lands, migrate this
 * module to a `user_preferences` table and
 * keep the same shape.
 */

const STORAGE_KEY = "momentry:preferences:v1";

export const DEFAULT_PREFERENCES = {
  notifications: {
    storyInvitations: true,
    collaborationActivity: true,
    sharedStoryActivity: true,
    productUpdates: false,
  },
  privacy: {
    showLocationOnSharedStories: true,
  },
  reading: {
    reduceMotion: false,
  },
};

export function getPreferences() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return structuredClone(
        DEFAULT_PREFERENCES
      );
    }

    const stored = JSON.parse(raw);

    // Shallow-merge per section so new
    // keys added later get defaults.
    return Object.fromEntries(
      Object.entries(
        DEFAULT_PREFERENCES
      ).map(([section, defaults]) => [
        section,
        {
          ...defaults,
          ...(stored?.[section] || {}),
        },
      ])
    );
  } catch {
    return structuredClone(
      DEFAULT_PREFERENCES
    );
  }
}

export function savePreferences(prefs) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(prefs)
  );
}

export function updatePreference(
  section,
  key,
  value
) {
  const prefs = getPreferences();

  prefs[section] = {
    ...prefs[section],
    [key]: value,
  };

  savePreferences(prefs);

  return prefs;
}
