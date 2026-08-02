export async function geocodeLocation(location) {
  if (!location) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location
      )}`
    );

    const data = await response.json();

    if (!data.length) return null;

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}