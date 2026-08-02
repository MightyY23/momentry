import {
  favoriteIcon,
  photoIcon,
  beachIcon,
  cafeIcon,
  tripIcon,
  birthdayIcon,
  natureIcon,
} from "./mapIcons";

export default function getMarkerIcon(moment) {
  const location =
    moment.location?.toLowerCase() || "";

  const title =
    moment.title?.toLowerCase() || "";

  if (moment.is_favorite)
    return favoriteIcon;

  if (
    location.includes("beach") ||
    title.includes("beach")
  )
    return beachIcon;

  if (
    location.includes("cafe") ||
    location.includes("coffee")
  )
    return cafeIcon;

  if (
    location.includes("park") ||
    location.includes("forest")
  )
    return natureIcon;

  if (
    title.includes("trip") ||
    title.includes("travel")
  )
    return tripIcon;

  if (
    title.includes("birthday")
  )
    return birthdayIcon;

  return photoIcon;
}