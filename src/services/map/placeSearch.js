const NOMINATIM = "https://nominatim.openstreetmap.org";

/**
 * Autocomplete suggestions while the user
 * types a place name. Returns up to 6
 * lightweight results:
 *   { label, lat, lng }
 */
export async function searchPlaces(query) {
  const trimmed = (query || "").trim();

  if (trimmed.length < 3) return [];

  try {
    const response = await fetch(
      `${NOMINATIM}/search?format=json&limit=6&addressdetails=0&q=${encodeURIComponent(
        trimmed
      )}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data || []).map((row) => ({
      label: row.display_name,
      lat: Number(row.lat),
      lng: Number(row.lon),
    }));
  } catch (err) {
    console.warn("searchPlaces failed:", err);

    return [];
  }
}

/**
 * Coordinates -> human-readable place name
 * (used by "pick on map" and capture-now).
 */
export async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `${NOMINATIM}/reverse?format=json&zoom=16&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (!data || data.error) return null;

    const a = data.address || {};

    const parts = [
      a.road,
      a.neighbourhood || a.suburb,
      a.city || a.town || a.village || a.county,
      a.country,
    ].filter(Boolean);

    return (
      parts.join(", ") ||
      data.display_name ||
      null
    );
  } catch (err) {
    console.warn("reverseGeocode failed:", err);

    return null;
  }
}
