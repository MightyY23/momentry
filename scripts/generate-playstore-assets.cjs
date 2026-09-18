/**
 * Generates the Play Store listing assets as
 * real PNGs — pure Node, no dependencies.
 *
 *   playstore/feature-graphic.png   1024x500  (required)
 *   playstore/icon-512.png          512x512   (required, full-bleed art)
 *   playstore/splash-1024.png       1024x1024 (TWA splash / social)
 *   playstore/banner-1024.png       1024x500  (announcement card art)
 *   playstore/screenshot-home.png   1080x1920 (phone screenshot 1)
 *   playstore/screenshot-storybook.png 1080x1920 (phone screenshot 2)
 *   playstore/screenshot-chat.png   1080x1920 (phone screenshot 3)
 *
 * The screenshots are stylised device mockups of
 * Momentry's actual UI (home hero, the book, the
 * chat) drawn programmatically — replace with
 * real device captures for the final listing if
 * you want pixel-accurate screens.
 *
 * Usage: node scripts/generate-playstore-assets.cjs
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

//------------------------------------------
// Minimal PNG encoder (RGBA, 8-bit)
//------------------------------------------

function crc32(buf) {
  let table = crc32.table;

  if (!table) {
    table = new Int32Array(256);

    for (let n = 0; n < 256; n++) {
      let c = n;

      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }

      table[n] = c;
    }

    crc32.table = table;
  }

  let crc = -1;

  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }

  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);

  len.writeUInt32BE(data.length);

  const typeBuf = Buffer.from(type, "ascii");

  const crcBuf = Buffer.alloc(4);

  crcBuf.writeUInt32BE(
    crc32(Buffer.concat([typeBuf, data]))
  );

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  const ihdr = Buffer.alloc(13);

  ihdr.writeUInt32BE(width, 0);

  ihdr.writeUInt32BE(height, 4);

  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;

  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;

    rgba.copy(
      raw,
      y * (stride + 1) + 1,
      y * stride,
      (y + 1) * stride
    );
  }

  const compressed = zlib.deflateSync(raw, {
    level: 9,
  });

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

//------------------------------------------
// Canvas: a tiny RGBA surface with the few
// primitives the art needs.
//------------------------------------------

function makeCanvas(w, h) {
  return {
    w,

    h,

    px: Buffer.alloc(w * h * 4),
  };
}

function blend(c, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;

  const idx = (y * c.w + x) * 4;

  const na = a / 255;

  const oa = c.px[idx + 3] / 255;

  const outA = na + oa * (1 - na);

  if (outA <= 0) return;

  c.px[idx] = Math.round(
    (r * na + c.px[idx] * oa * (1 - na)) / outA
  );

  c.px[idx + 1] = Math.round(
    (g * na + c.px[idx + 1] * oa * (1 - na)) / outA
  );

  c.px[idx + 2] = Math.round(
    (b * na + c.px[idx + 2] * oa * (1 - na)) / outA
  );

  c.px[idx + 3] = Math.round(outA * 255);
}

function fillRect(c, x0, y0, w, h, [r, g, b, a = 255]) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      blend(c, x, y, r, g, b, a);
    }
  }
}

function fillRounded(
  c,
  x0,
  y0,
  w,
  h,
  rad,
  color
) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      // distance into the corner circle
      const dx = Math.max(
        rad - x + x0,

        x - (x0 + w - 1 - rad),

        0
      );

      const dy = Math.max(
        rad - y + y0,

        y - (y0 + h - 1 - rad),

        0
      );

      const d = Math.sqrt(
        dx * dx + dy * dy
      );

      const cov = Math.max(
        0,

        Math.min(1, rad - d + 0.5)
      );

      if (cov > 0) {
        blend(
          c,

          x,

          y,

          color[0],

          color[1],

          color[2],

          (color[3] ?? 255) * cov
        );
      }
    }
  }
}

function fillCircle(c, cx, cy, rad, color) {
  const r = Math.ceil(rad);

  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.sqrt(
        (x - cx) * (x - cx) + (y - cy) * (y - cy)
      );

      const cov = Math.max(
        0,

        Math.min(1, rad - d + 0.5)
      );

      if (cov > 0) {
        blend(
          c,

          x,

          y,

          color[0],

          color[1],

          color[2],

          (color[3] ?? 255) * cov
        );
      }
    }
  }
}

// 5x7 bitmap font: only the glyphs the art
// needs (A-Z, 0-9, space, a few marks).
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10011", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "11110", "10001", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "'": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
};

function drawText(
  c,
  text,
  x,
  y,
  scale,
  color,
  align = "left"
) {
  const gw = 6 * scale; // 5px glyph + 1px gap

  const totalW = text.length * gw - scale;

  let cx = x;

  if (align === "center") {
    cx = Math.round(x - totalW / 2);
  } else if (align === "right") {
    cx = x - totalW;
  }

  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch];

    if (!glyph) continue;

    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] === "1") {
          fillRect(
            c,

            cx + gx * scale,

            y + gy * scale,

            scale,

            scale,

            color
          );
        }
      }
    }

    cx += gw;
  }
}

// Heart (same implicit curve as the icon).
function insideHeart(x, y) {
  const nx = x;

  const ny = -y;

  const a = nx * nx + ny * ny - 1;

  return (
    a * a * a - nx * nx * ny * ny * ny < 0
  );
}

function drawHeart(
  c,
  cx,
  cy,
  size,
  color,
  alpha = 255
) {
  const half = size / 2;

  for (let y = -half; y < half; y++) {
    for (let x = -half; x < half; x++) {
      const mx = (x / half) * 1.4;

      const my = (y / half) * 1.35 + 0.15;

      if (insideHeart(mx, my)) {
        blend(
          c,

          cx + x,

          cy + y,

          color[0],

          color[1],

          color[2],

          alpha
        );
      }
    }
  }
}

//------------------------------------------
// Palette (Rose Noir)
//------------------------------------------

const P = {
  bgTop: [20, 14, 16], // #140e10 near-black rose
  bgBottom: [58, 14, 30], // deep rose
  primary: [255, 92, 141], // #ff5c8d
  primaryDim: [122, 23, 59], // #7a173b
  cream: [247, 239, 228], // #f7efe4
  creamDark: [240, 228, 208], // sepia page
  white: [255, 255, 255],
  muted: [210, 170, 185],
  gold: [212, 160, 74],
};

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function gradFill(c, top, bottom, diagonal = false) {
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const t = diagonal
        ? (x / c.w + y / c.h) / 2
        : y / c.h;

      blend(
        c,

        x,

        y,

        lerp(top[0], bottom[0], t),

        lerp(top[1], bottom[1], t),

        lerp(top[2], bottom[2], t),

        255
      );
    }
  }
}

function sprinkleHearts(
  c,
  count,
  seed,
  alpha = 26
) {
  let s = seed;

  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;

    return s / 2147483648;
  };

  for (let i = 0; i < count; i++) {
    drawHeart(
      c,

      Math.floor(rand() * c.w),

      Math.floor(rand() * c.h),

      6 + Math.floor(rand() * 14),

      P.white,

      alpha
    );
  }
}

//------------------------------------------
// 1. Feature graphic 1024x500
//------------------------------------------

function featureGraphic() {
  const c = makeCanvas(1024, 500);

  gradFill(c, P.bgTop, P.bgBottom, true);

  sprinkleHearts(c, 26, 42);

  // Big heart, left side.
  drawHeart(c, 210, 250, 300, P.primary, 255);

  drawHeart(c, 210, 250, 300, P.white, 70);

  // Title.
  drawText(
    c,

    "MOMENTRY",

    430,

    150,

    9,

    P.white,

    "left"
  );

  // Tagline (two lines).
  drawText(
    c,

    "EVERY MEMORY DESERVES",

    432,

    250,

    4,

    P.cream,

    "left"
  );

  drawText(
    c,

    "ITS OWN CHAPTER",

    432,

    300,

    4,

    P.cream,

    "left"
  );

  // Accent underline.
  fillRounded(
    c,

    432,

    360,

    300,

    6,

    3,

    P.primary
  );

  return encodePNG(c.w, c.h, c.px);
}

//------------------------------------------
// 2. Hi-res icon 512 (full-bleed artwork —
//    Play resizes its own masks)
//------------------------------------------

function icon512() {
  const c = makeCanvas(512, 512);

  gradFill(c, P.primary, P.primaryDim, true);

  drawHeart(c, 256, 256, 330, P.white, 255);

  return encodePNG(c.w, c.h, c.px);
}

//------------------------------------------
// 3. Splash 1024 (dark, brand mark + name)
//------------------------------------------

function splash1024() {
  const c = makeCanvas(1024, 1024);

  gradFill(c, P.bgTop, P.bgBottom, false);

  sprinkleHearts(c, 14, 7, 18);

  drawHeart(c, 512, 430, 300, P.primary, 255);

  drawText(
    c,

    "MOMENTRY",

    512,

    640,

    8,

    P.white,

    "center"
  );

  drawText(
    c,

    "PRESERVE AND RELIVE YOUR MOMENTS",

    512,

    760,

    3,

    P.muted,

    "center"
  );

  return encodePNG(c.w, c.h, c.px);
}

//------------------------------------------
// 4. Banner 1024x500 (announcement art)
//------------------------------------------

function banner1024() {
  const c = makeCanvas(1024, 500);

  gradFill(c, P.primary, P.primaryDim, true);

  sprinkleHearts(c, 18, 99, 40);

  drawText(
    c,

    "YOUR STORY TOGETHER",

    512,

    170,

    7,

    P.white,

    "center"
  );

  drawText(
    c,

    "ONE BEAUTIFUL BOOK",

    512,

    290,

    7,

    P.cream,

    "center"
  );

  drawHeart(c, 512, 420, 90, P.white, 220);

  return encodePNG(c.w, c.h, c.px);
}

//------------------------------------------
// 5. Phone screenshots 1080x1920 — stylised
//    mockups of Momentry's real UI.
//------------------------------------------

function phoneShell() {
  const c = makeCanvas(1080, 1920);

  // Studio backdrop.
  gradFill(c, P.bgTop, P.bgBottom, false);

  sprinkleHearts(c, 10, 5, 14);

  // Device body.
  fillRounded(
    c,

    140,

    120,

    800,

    1680,

    60,

    [10, 8, 9]
  );

  // Screen.
  fillRounded(
    c,

    170,

    150,

    740,

    1620,

    40,

    P.cream
  );

  return c;
}

// Status bar + app top bar.
function drawChrome(c, dark = false) {
  const text = dark ? P.white : P.bgTop;

  // Status bar.
  drawText(c, "9:41", 220, 180, 4, text);

  fillRect(c, 820, 196, 8, 14, text);

  fillRect(c, 836, 190, 8, 20, text);

  fillRect(c, 852, 184, 8, 26, text);

  // App bar.
  drawHeart(c, 230, 290, 44, P.primary);

  drawText(c, "MOMENTRY", 300, 272, 4, text);

  // Tab bar.
  const tabLabels = [
    "HOME",

    "GALLERY",

    "BOOK",

    "MAP",

    "PROFILE",
  ];

  const tw = 148;

  let tx = 170 + (740 - tabLabels.length * tw) / 2;

  for (const t of tabLabels) {
    drawText(
      c,

      t,

      tx + tw / 2,

      1672,

      2,

      dark ? P.muted : [150, 130, 140],

      "center"
    );

    tx += tw;
  }

  fillRounded(
    c,

    170 + (740 - 180) / 2,

    1720,

    180,

    8,

    4,

    dark ? P.muted : [150, 130, 140]
  );
}

function screenshotHome() {
  const c = phoneShell();

  drawChrome(c, false);

  // Hero card.
  fillRounded(
    c,

    200,

    340,

    680,

    300,

    28,

    P.white
  );

  drawText(
    c,

    "US",

    240,

    380,

    5,

    P.primary
  );

  drawText(
    c,

    "TOGETHER SINCE DEC 6",

    240,

    470,

    3,

    [120, 100, 110]
  );

  fillRounded(
    c,

    240,

    540,

    220,

    44,

    22,

    P.primary
  );

  drawText(
    c,

    "285 DAYS",

    350,

    552,

    3,

    P.white,

    "center"
  );

  // Memory of the day card.
  fillRounded(
    c,

    200,

    680,

    680,

    340,

    28,

    P.creamDark
  );

  drawText(
    c,

    "MEMORY OF THE DAY",

    240,

    720,

    3,

    P.primaryDim
  );

  fillRounded(
    c,

    240,

    780,

    600,

    160,

    20,

    P.muted
  );

  drawHeart(c, 540, 860, 70, P.primaryDim, 120);

  // Stats row.
  const stats = [
    ["12", "MEMORIES"],

    ["4", "CHAPTERS"],

    ["3", "FAVES"],
  ];

  let sx = 200;

  for (const [n, l] of stats) {
    fillRounded(
      c,

      sx,

      1060,

      220,

      160,

      24,

      P.white
    );

    drawText(
      c,

      n,

      sx + 110,

      1090,

      6,

      P.primary,

      "center"
    );

    drawText(
      c,

      l,

      sx + 110,

      1180,

      2,

      [130, 110, 120],

      "center"
    );

    sx += 230;
  }

  // FAB.
  fillCircle(c, 810, 1560, 64, P.primary);

  drawText(
    c,

    "+",

    810,

    1528,

    7,

    P.white,

    "center"
  );

  return encodePNG(c.w, c.h, c.px);
}

function screenshotStorybook() {
  const c = phoneShell();

  // Dark reading theme.
  fillRounded(
    c,

    170,

    150,

    740,

    1620,

    40,

    P.bgTop
  );

  // Reader pill.
  fillRounded(
    c,

    400,

    200,

    280,

    70,

    35,

    [40, 30, 34]
  );

  drawText(
    c,

    "A-  A+  *  #",

    540,

    218,

    3,

    P.muted,

    "center"
  );

  // Book page.
  fillRounded(
    c,

    210,

    320,

    660,

    1180,

    30,

    P.creamDark
  );

  drawText(
    c,

    "CHAPTER 2",

    540,

    380,

    3,

    P.primaryDim,

    "center"
  );

  drawText(
    c,

    "WOVEN ACROSS",

    540,

    450,

    6,

    P.bgTop,

    "center"
  );

  drawText(
    c,

    "MILES",

    540,

    540,

    6,

    P.bgTop,

    "center"
  );

  drawHeart(c, 540, 660, 40, P.gold);

  // Photo block.
  fillRounded(
    c,

    260,

    720,

    560,

    300,

    20,

    P.muted
  );

  // Story text lines.
  for (let i = 0; i < 7; i++) {
    fillRounded(
      c,

      270,

      1070 + i * 60,

      i % 3 === 2 ? 420 : 540,

      18,

      9,

      [176, 158, 142]
    );
  }

  // Nav row.
  fillRounded(
    c,

    210,

    1560,

    300,

    90,

    45,

    P.primaryDim
  );

  drawText(
    c,

    "PREV",

    360,

    1588,

    4,

    P.white,

    "center"
  );

  fillRounded(
    c,

    570,

    1560,

    300,

    90,

    45,

    P.primary
  );

  drawText(
    c,

    "NEXT",

    720,

    1588,

    4,

    P.white,

    "center"
  );

  return encodePNG(c.w, c.h, c.px);
}

function screenshotChat() {
  const c = phoneShell();

  drawChrome(c, false);

  // Chat bubbles — mine right (pink), theirs left (white).
  const bubbles = [
    { mine: false, y: 380, w: 420, text: "MISS YOU" },

    { mine: true, y: 500, w: 360, text: "SEE YOU FRIDAY!" },

    { mine: false, y: 620, w: 460, text: "BRING THE CAMERA" },

    { mine: true, y: 740, w: 300, text: "ALWAYS" },

    { mine: false, y: 900, w: 380, note: true },
  ];

  for (const b of bubbles) {
    const x = b.mine ? 1080 - 210 - b.w : 210;

    fillRounded(
      c,

      x,

      b.y,

      b.w,

      b.note ? 130 : 90,

      30,

      b.note
        ? P.creamDark
        : b.mine
          ? P.primary
          : P.white
    );

    if (b.note) {
      drawText(
        c,

        "SEALED NOTE",

        x + b.w / 2,

        b.y + 30,

        3,

        P.primaryDim,

        "center"
      );

      drawHeart(c, x + b.w / 2, b.y + 88, 26, P.primaryDim);
    } else {
      drawText(
        c,

        b.text,

        x + 40,

        b.y + 30,

        3,

        b.mine ? P.white : P.bgTop
      );
    }
  }

  // Composer.
  fillRounded(
    c,

    200,

    1560,

    560,

    90,

    45,

    P.white
  );

  drawText(
    c,

    "MESSAGE",

    250,

    1588,

    3,

    [170, 150, 160]
  );

  fillCircle(c, 830, 1605, 46, P.primary);

  drawText(
    c,

    ">",

    830,

    1584,

    5,

    P.white,

    "center"
  );

  return encodePNG(c.w, c.h, c.px);
}

//------------------------------------------
// Write everything
//------------------------------------------

const outDir = path.join(
  __dirname,

  "..",

  "playstore"
);

fs.mkdirSync(outDir, { recursive: true });

const assets = [
  ["feature-graphic.png", featureGraphic()],

  ["icon-512.png", icon512()],

  ["splash-1024.png", splash1024()],

  ["banner-1024.png", banner1024()],

  ["screenshot-home.png", screenshotHome()],

  ["screenshot-storybook.png", screenshotStorybook()],

  ["screenshot-chat.png", screenshotChat()],
];

for (const [name, png] of assets) {
  fs.writeFileSync(
    path.join(outDir, name),

    png
  );

  console.log(
    `wrote playstore/${name} (${png.length} bytes)`
  );
}

console.log(
  "\nPlay Store spec: feature graphic 1024x500 (required), icon 512x512 (required), screenshots 1080x1920 (2-8 required)."
);
