import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateIconPNG(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw image buffer with 1 filter byte (0) per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? size * 0.45 : size * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Cosmic background gradient (Indigo -> Deep Obsidian)
      const gradT = (x + y) / (width + height);
      let r = Math.round(11 + 30 * (1 - gradT));
      let g = Math.round(15 + 40 * gradT);
      let b = Math.round(25 + 90 * gradT);
      let a = 255;

      // Inner glowing icon card
      const cardHalf = size * (isMaskable ? 0.32 : 0.36);
      const inCardX = Math.abs(dx) <= cardHalf;
      const inCardY = Math.abs(dy) <= cardHalf;

      if (inCardX && inCardY) {
        // Card gradient (Indigo 600 -> Purple 700)
        r = 79 + Math.round(60 * gradT);
        g = 70 + Math.round(30 * gradT);
        b = 229;
      }

      // Draw stylized "S L" monogram & central visual nodes
      const insideS = (
        (Math.abs(dy) < size * 0.04 && Math.abs(dx) < size * 0.18) ||
        (dy < 0 && dy > -size * 0.18 && Math.abs(dx + size * 0.14) < size * 0.04) ||
        (dy > 0 && dy < size * 0.18 && Math.abs(dx - size * 0.14) < size * 0.04) ||
        (Math.abs(dy + size * 0.18) < size * 0.04 && Math.abs(dx) < size * 0.18) ||
        (Math.abs(dy - size * 0.18) < size * 0.04 && Math.abs(dx) < size * 0.18)
      );

      if (insideS) {
        r = 255;
        g = 255;
        b = 255;
      }

      // Glowing cyan connect nodes
      const dNode1 = Math.sqrt((dx + size * 0.22) ** 2 + (dy - size * 0.18) ** 2);
      const dNode2 = Math.sqrt((dx - size * 0.22) ** 2 + (dy + size * 0.18) ** 2);
      if (dNode1 < size * 0.038 || dNode2 < size * 0.038) {
        r = 6;
        g = 182;
        b = 212;
      }

      // Outer boundary rounding (unless maskable, which is full bleed)
      if (!isMaskable && dist > radius) {
        // Corner smoothing / anti-aliasing
        const edge = dist - radius;
        if (edge > 2) {
          a = 0;
        } else {
          a = Math.max(0, Math.round(255 * (1 - edge / 2)));
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk: width(4), height(4), bitDepth(1)=8, colorType(1)=6(RGBA), comp(1)=0, filter(1)=0, interlace(1)=0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateIconPNG(192, false));

console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateIconPNG(512, false));

console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateIconPNG(512, true));

console.log('Generating apple-touch-icon.png (180x180)...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateIconPNG(180, false));

console.log('Generating favicon.ico / 64px...');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateIconPNG(64, false));

console.log('All PWA icon assets generated successfully in /public!');
