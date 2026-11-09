import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(scriptDir, '..', 'public');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function mix(first, second, amount) {
  const t = clamp(amount);
  return [
    first[0] + (second[0] - first[0]) * t,
    first[1] + (second[1] - first[1]) * t,
    first[2] + (second[2] - first[2]) * t,
  ];
}

function roundedRectDistance(x, y, cx, cy, halfWidth, halfHeight, radius) {
  const qx = Math.abs(x - cx) - (halfWidth - radius);
  const qy = Math.abs(y - cy) - (halfHeight - radius);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    radius
  );
}

function circleDistance(x, y, cx, cy, radius) {
  return Math.hypot(x - cx, y - cy) - radius;
}

const SNOW = [
  [0.14, 0.16, 0.012, 0.55],
  [0.3, 0.1, 0.008, 0.4],
  [0.82, 0.3, 0.011, 0.5],
  [0.9, 0.56, 0.007, 0.35],
  [0.74, 0.86, 0.01, 0.42],
  [0.2, 0.68, 0.009, 0.38],
  [0.08, 0.46, 0.007, 0.3],
  [0.62, 0.12, 0.006, 0.3],
];

function backgroundSample(x, y) {
  let color = mix([11, 16, 32], [23, 35, 63], y);

  const redGlow = Math.max(0, 1 - Math.hypot(x - 0.8, y - 0.08) / 0.62);
  color = mix(color, [225, 29, 72], redGlow * 0.24);

  const greenGlow = Math.max(0, 1 - Math.hypot(x - 0.12, y - 0.9) / 0.58);
  color = mix(color, [16, 185, 129], greenGlow * 0.14);

  for (const [snowX, snowY, radius, alpha] of SNOW) {
    if (circleDistance(x, y, snowX, snowY, radius) <= 0) {
      color = mix(color, [255, 255, 255], alpha);
    }
  }

  return color;
}

function giftSample(x, y, scale) {
  const gx = 0.5 + (x - 0.5) / scale;
  const gy = 0.5 + (y - 0.5) / scale;

  // Soft shadow below the gift.
  if (
    roundedRectDistance(gx, gy, 0.5, 0.805, 0.23, 0.025, 0.02) <= 0
  ) {
    return [4, 8, 18, 0.42];
  }

  // Gift box.
  if (
    roundedRectDistance(gx, gy, 0.5, 0.62, 0.24, 0.17, 0.026) <= 0
  ) {
    const t = clamp((gy - 0.45) / 0.34);
    const boxColor = mix([220, 38, 38], [159, 18, 57], t);

    // Vertical ribbon.
    if (
      roundedRectDistance(gx, gy, 0.5, 0.62, 0.036, 0.172, 0.008) <= 0
    ) {
      return [...mix([251, 191, 36], [245, 158, 11], t), 1];
    }

    // Horizontal ribbon.
    if (
      roundedRectDistance(gx, gy, 0.5, 0.6, 0.242, 0.031, 0.008) <= 0
    ) {
      return [...mix([251, 191, 36], [245, 158, 11], t), 1];
    }

    // Inner highlight on the top-left of the box.
    if (
      roundedRectDistance(gx, gy, 0.43, 0.54, 0.13, 0.045, 0.02) <= 0
    ) {
      return [...mix(boxColor, [255, 255, 255], 0.08), 1];
    }

    return [...boxColor, 1];
  }

  // Lid.
  if (
    roundedRectDistance(gx, gy, 0.5, 0.455, 0.272, 0.046, 0.022) <= 0
  ) {
    return [...mix([244, 63, 94], [190, 18, 60], 0.5), 1];
  }

  // Bow loops.
  if (
    circleDistance(gx, gy, 0.412, 0.382, 0.077) <= 0 ||
    circleDistance(gx, gy, 0.588, 0.382, 0.077) <= 0
  ) {
    return [...mix([251, 191, 36], [217, 119, 6], 0.4), 1];
  }

  // Bow knot.
  if (circleDistance(gx, gy, 0.5, 0.385, 0.038) <= 0) {
    return [180, 83, 9, 1];
  }

  return null;
}

function sampleColor(x, y, maskable, contentScale) {
  if (!maskable) {
    if (roundedRectDistance(x, y, 0.5, 0.5, 0.5, 0.5, 0.225) > 0) {
      return null;
    }
  }

  const background = backgroundSample(x, y);
  const gift = giftSample(x, y, contentScale);
  if (!gift) return [...background, 1];

  const [red, green, blue, alpha] = gift;
  const giftColor = [red, green, blue];
  return [...mix(background, giftColor, alpha), 1];
}

function renderIcon(size, { maskable = false, contentScale = 1 } = {}) {
  const samples = size >= 512 ? 3 : 4;
  const rgba = Buffer.alloc(size * size * 4);
  const sampleCount = samples * samples;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = (x + (sx + 0.5) / samples) / size;
          const py = (y + (sy + 0.5) / samples) / size;
          const color = sampleColor(px, py, maskable, contentScale);
          if (!color) continue;
          red += color[0] * color[3];
          green += color[1] * color[3];
          blue += color[2] * color[3];
          alpha += color[3];
        }
      }

      const offset = (y * size + x) * 4;
      if (alpha > 0) {
        rgba[offset] = Math.round(red / alpha);
        rgba[offset + 1] = Math.round(green / alpha);
        rgba[offset + 2] = Math.round(blue / alpha);
        rgba[offset + 3] = Math.round((alpha / sampleCount) * 255);
      }
    }
  }

  return encodePng(size, size, rgba);
}

function createIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title">
  <title id="title">Christmas Wishlist</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1020" />
      <stop offset="1" stop-color="#17233f" />
    </linearGradient>
    <radialGradient id="glowRed" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#e11d48" stop-opacity=".42" />
      <stop offset="1" stop-color="#e11d48" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowGreen" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#10b981" stop-opacity=".26" />
      <stop offset="1" stop-color="#10b981" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="box" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dc2626" />
      <stop offset="1" stop-color="#9f1239" />
    </linearGradient>
    <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbbf24" />
      <stop offset="1" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)" />
  <circle cx="402" cy="76" r="220" fill="url(#glowRed)" />
  <circle cx="72" cy="464" r="210" fill="url(#glowGreen)" />
  <g fill="#ffffff" opacity=".42">
    <circle cx="76" cy="92" r="4" />
    <circle cx="154" cy="58" r="3" />
    <circle cx="438" cy="164" r="4" />
    <circle cx="462" cy="292" r="3" />
    <circle cx="386" cy="430" r="4" />
    <circle cx="112" cy="352" r="3" />
    <circle cx="42" cy="238" r="2.5" />
  </g>
  <ellipse cx="256" cy="416" rx="122" ry="14" fill="#040812" opacity=".55" />
  <rect x="130" y="236" width="252" height="168" rx="16" fill="url(#box)" />
  <rect x="256" y="236" width="38" height="168" fill="url(#ribbon)" />
  <rect x="130" y="302" width="252" height="32" fill="url(#ribbon)" />
  <rect x="112" y="210" width="288" height="54" rx="16" fill="#e11d48" />
  <rect x="238" y="210" width="36" height="54" fill="url(#ribbon)" />
  <circle cx="212" cy="190" r="46" fill="url(#ribbon)" />
  <circle cx="300" cy="190" r="46" fill="url(#ribbon)" />
  <circle cx="256" cy="192" r="23" fill="#b45309" />
  <path d="M188 236h74v168h-74z" fill="#ffffff" opacity=".06" />
</svg>
`;

fs.mkdirSync(publicDir, { recursive: true });

const icon512 = renderIcon(512, { contentScale: 1 });
const icon192 = renderIcon(192, { contentScale: 1 });
const maskable512 = renderIcon(512, {
  maskable: true,
  contentScale: 0.82,
});
const appleTouch = renderIcon(180, {
  maskable: true,
  contentScale: 0.86,
});
const faviconPng = renderIcon(32, { contentScale: 1 });

fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), maskable512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createIco(faviconPng, 32));
fs.writeFileSync(path.join(publicDir, 'icon.svg'), ICON_SVG);

console.log('Generated PWA icons in public/.');
