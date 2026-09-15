/**
 * Generates PWA icons (192, 512, maskable-512)
 * as real PNGs — pure Node, no dependencies.
 *
 * Draws the Momentry heart on the Rose Noir
 * gradient; the maskable variant pads the
 * artwork into the safe zone (80%).
 *
 * Usage: node scripts/generate-icons.cjs
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
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Filter 0 per scanline.
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
// Heart rendering (signed-distance style)
//------------------------------------------

// Implicit heart: (x^2 + y^2 - 1)^3 - x^2*y^3 < 0
// Canvas coords: x in [-1.4, 1.4], y in [-1.5, 1.2]
function insideHeart(x, y) {
  const nx = x;
  const ny = -y; // flip: math heart points down

  const a = nx * nx + ny * ny - 1;

  return (
    a * a * a - nx * nx * ny * ny * ny < 0
  );
}

function withAntiAlias(px, py, size) {
  // Supersample 3x3.
  let hit = 0;

  for (let sy = -1; sy <= 1; sy++) {
    for (let sx = -1; sx <= 1; sx++) {
      const x =
        ((px + sx / 3) / size) * 2.8 - 1.4;

      const y =
        ((py + sy / 3) / size) * 2.7 - 1.35;

      if (insideHeart(x, y)) hit++;
    }
  }

  return hit / 9;
}

function generateIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);

  // Rose Noir gradient: #ff5c8d -> #7a173b (diagonal)
  const top = [255, 92, 141];
  const bottom = [122, 23, 59];

  // Artwork occupies 78% (regular) / 66% (maskable
  // keeps ~10% safe zone on every edge).
  const artScale = maskable ? 0.62 : 0.8;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Background gradient.
      const t = (x + y) / (2 * size);

      let r = top[0] + (bottom[0] - top[0]) * t;
      let g = top[1] + (bottom[1] - top[1]) * t;
      let b = top[2] + (bottom[2] - top[2]) * t;

      let a = 255;

      // Centered artwork box.
      const art = size * artScale;

      const ox = (size - art) / 2;
      const oy = (size - art) / 2;

      if (
        x >= ox &&
        x < ox + art &&
        y >= oy &&
        y < oy + art
      ) {
        const coverage = withAntiAlias(
          x - ox,
          y - oy,
          art
        );

        if (coverage > 0) {
          // White heart over the gradient.
          r = r + (255 - r) * coverage;
          g = g + (255 - g) * coverage;
          b = b + (255 - b) * coverage;
        }
      }

      rgba[idx] = Math.round(r);
      rgba[idx + 1] = Math.round(g);
      rgba[idx + 2] = Math.round(b);
      rgba[idx + 3] = a;
    }
  }

  return encodePNG(size, size, rgba);
}

const outDir = path.join(
  __dirname,
  "..",
  "public",
  "icons"
);

fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  {
    file: "icon-maskable-512.png",
    size: 512,
    maskable: true,
  },
];

for (const t of targets) {
  const png = generateIcon(t.size, t.maskable);

  fs.writeFileSync(
    path.join(outDir, t.file),
    png
  );

  console.log(
    `wrote public/icons/${t.file} (${png.length} bytes)`
  );
}
