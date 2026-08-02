import L from "leaflet";

function createEmojiIcon(
  emoji,
  background,
  glow
) {
  return L.divIcon({
    className: "",
    iconSize: [54, 54],
    iconAnchor: [27, 54],
    popupAnchor: [0, -46],

    html: `
      <div
        style="
          position:relative;
          width:54px;
          height:54px;
          display:flex;
          align-items:center;
          justify-content:center;
        "
      >

        <div
          style="
            position:absolute;
            inset:0;
            border-radius:50%;
            background:${glow};
            filter:blur(14px);
            opacity:.55;
            transform:scale(.95);
          "
        ></div>

        <div
          style="
            position:relative;
            width:46px;
            height:46px;
            border-radius:50%;
            background:${background};
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:22px;

            border:4px solid white;

            box-shadow:
              0 12px 28px rgba(0,0,0,.22),
              inset 0 1px 2px rgba(255,255,255,.35);

            transition:.25s;
          "
        >
          ${emoji}
        </div>

      </div>
    `,
  });
}

export const favoriteIcon =
  createEmojiIcon(
    "❤️",
    "linear-gradient(135deg,#ff4d88,#ff7fa8)",
    "rgba(255,92,141,.55)"
  );

export const photoIcon =
  createEmojiIcon(
    "📷",
    "linear-gradient(135deg,#5b8cff,#73b6ff)",
    "rgba(91,140,255,.45)"
  );

export const beachIcon =
  createEmojiIcon(
    "🏖️",
    "linear-gradient(135deg,#00d68f,#00b894)",
    "rgba(0,214,143,.45)"
  );

export const cafeIcon =
  createEmojiIcon(
    "☕",
    "linear-gradient(135deg,#b56a2d,#8b5a2b)",
    "rgba(139,90,43,.45)"
  );

export const tripIcon =
  createEmojiIcon(
    "✈️",
    "linear-gradient(135deg,#b26dff,#8f4dff)",
    "rgba(143,77,255,.45)"
  );

export const birthdayIcon =
  createEmojiIcon(
    "🎂",
    "linear-gradient(135deg,#ffbe3d,#ff9800)",
    "rgba(255,152,0,.45)"
  );

export const natureIcon =
  createEmojiIcon(
    "🌿",
    "linear-gradient(135deg,#57d66d,#43a047)",
    "rgba(67,160,71,.45)"
  );