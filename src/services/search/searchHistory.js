const STORAGE_KEY =
  "momentry_recent_searches";

const LIMIT = 8;

//---------------------------------------

export function getRecentSearches() {
  try {
    return (
      JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || []
    );
  } catch {
    return [];
  }
}

//---------------------------------------

export function saveRecentSearch(query) {
  if (!query.trim()) return;

  const searches =
    getRecentSearches();

  const updated = [
    query,
    ...searches.filter(
      (s) => s !== query
    ),
  ].slice(0, LIMIT);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );
}

//---------------------------------------

export function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY);
}