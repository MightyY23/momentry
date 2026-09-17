const PHOTON = "https://photon.komoot.io";

const NOMINATIM =
  "https://nominatim.openstreetmap.org";

//----------------------------------------
// Place autocomplete
//
// Photon (OSM + Geocoder) is primary —
// its coverage of India and non-Western
// regions is far better than Nominatim's
// search ranking. Nominatim is the
// fallback when Photon finds nothing or
// is unreachable.
//
// Returns up to 6 of:
//   { label, lat, lng, city, country }
//----------------------------------------

function photonLabel(props) {
  const parts = [
    props.name,
    props.street &&
    props.name !== props.street
      ? props.street
      : null,
    props.district ||
      props.suburb ||
      props.neighbourhood,
    props.city ||
      props.town ||
      props.village ||
      props.county,
    props.state,
    props.country,
  ].filter(Boolean);

  return parts.join(", ");
}

export async function searchPlaces(
  query
) {
  const trimmed = (query || "")
    .trim();

  if (trimmed.length < 2) return [];

  // -------- Photon first --------

  try {
    const response = await fetch(
      `${PHOTON}/api?q=${encodeURIComponent(
        trimmed
      )}&limit=6`
    );

    if (response.ok) {
      const data =
        await response.json();

      const results = (
        data.features || []
      )
        .map((f) => ({
          label: photonLabel(
            f.properties || {}
          ),
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
          city:
            f.properties?.city ||
            f.properties?.town ||
            f.properties?.village,
          country:
            f.properties?.country,
        }))
        .filter(
          (r) =>
            r.lat != null && r.lng != null
        );

      if (results.length) {
        return results;
      }
    }
  } catch (err) {
    console.warn(
      "Photon search failed:",
      err
    );
  }

  // -------- Nominatim fallback --------

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

    return (data || []).map(
      (row) => ({
        label: row.display_name,
        lat: Number(row.lat),
        lng: Number(row.lon),
      })
    );
  } catch (err) {
    console.warn(
      "Nominatim fallback failed:",
      err
    );

    return [];
  }
}

//----------------------------------------
// Reverse geocoding — coordinates to a
// human place name. Photon first, then
// Nominatim.
//----------------------------------------

export async function reverseGeocode(
  lat,
  lng
) {
  // -------- Photon --------

  try {
    const response = await fetch(
      `${PHOTON}/reverse?lat=${lat}&lon=${lng}`
    );

    if (response.ok) {
      const data =
        await response.json();

      const f = data.features?.[0];

      if (f) {
        const label = photonLabel(
          f.properties || {}
        );

        if (label) return label;
      }
    }
  } catch (err) {
    console.warn(
      "Photon reverse failed:",
      err
    );
  }

  // -------- Nominatim --------

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

    const data =
      await response.json();

    if (!data || data.error)
      return null;

    const a = data.address || {};

    const parts = [
      a.road,
      a.neighbourhood || a.suburb,
      a.city ||
        a.town ||
        a.village ||
        a.county,
      a.country,
    ].filter(Boolean);

    return (
      parts.join(", ") ||
      data.display_name ||
      null
    );
  } catch (err) {
    console.warn(
      "Nominatim reverse failed:",
      err
    );

    return null;
  }
}
