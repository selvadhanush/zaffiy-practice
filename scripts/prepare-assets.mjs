// Converts the raw 1920x1080 frame sequence into web-optimised, bg-matched frames.
// - lifts blacks to exactly #060606 (page bg) so frames have no visible edges
// - erases the corner watermark
// - feathers borders into the bg colour
// Usage: node scripts/prepare-assets.mjs [srcDir]
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2] || "E:/frames";
const BG = 6;
const files = fs.readdirSync(SRC).filter((f) => /^frame-\d+\.jpg$/i.test(f)).sort();
console.log(`${files.length} frames`);

const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

async function clean(file) {
  const { data, info } = await sharp(path.join(SRC, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const cx = 1740 * (W / 1920), cy = 900 * (H / 1080), r0 = 75 * (W / 1920), r1 = 110 * (W / 1920);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, y - cy);
    const keep = smooth((d - r0) / (r1 - r0));
    const i = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) {
      const v = Math.max(data[i + c], BG);
      data[i + c] = Math.round(BG + (v - BG) * keep);
    }
  }
  return { data, W, H };
}

async function feather(buf, W, H, inset) {
  const ix = W * inset, iy = H * inset;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const w = smooth(Math.min(x, W - 1 - x) / ix) * smooth(Math.min(y, H - 1 - y) / iy);
    const i = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.round(BG + (buf[i + c] - BG) * w);
  }
}

async function variant(clean_, outPath, crop, size, inset, q) {
  let img = sharp(clean_.data, { raw: { width: clean_.W, height: clean_.H, channels: 3 } });
  if (crop) img = img.extract(crop);
  const { data, info } = await img.resize(size.w, size.h, { kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
  await feather(data, info.width, info.height, inset);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
    .webp({ quality: q, effort: 5 }).toFile(outPath);
}

for (let n = 0; n < files.length; n++) {
  const c = await clean(files[n]);
  const id = String(n + 1).padStart(4, "0");
  await variant(c, `public/frames/d/${id}.webp`, null, { w: 1440, h: 810 }, 0.06, 78);
  await variant(c, `public/frames/m/${id}.webp`, { left: 600, top: 0, width: 720, height: 1080 }, { w: 480, h: 720 }, 0.04, 74);
  if (n % 40 === 0) console.log(n + 1);
}

// Static hero for reduced motion + macro crops (from first/last frames)
const last = await clean(files[files.length - 1]);
await variant(last, "public/img/hero-exploded.webp", null, { w: 1920, h: 1080 }, 0.06, 86);
const first = await clean(files[0]);
const macro = async (name, src, crop, size, q = 88) => {
  const raw = await sharp(src.data, { raw: { width: src.W, height: src.H, channels: 3 } })
    .extract(crop).resize(size.w, size.h, { kernel: "lanczos3" }).modulate({ brightness: 1.05 }).webp({ quality: q }).toFile(`public/img/${name}.webp`);
};
await macro("macro-amber", first, { left: 520, top: 470, width: 880, height: 440 }, { w: 2200, h: 1100 });
await macro("macro-cap", first, { left: 700, top: 120, width: 520, height: 520 }, { w: 1100, h: 1100 });
console.log("done");
