import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const sources = {
  "icon-192.png": "public/icon.svg",
  "icon-512.png": "public/icon.svg",
};

const maskable = `public/icons/icon-maskable-512.png`;

// Same artwork, inset inside the 80% safe zone on a full-bleed square.
const maskableSvg = readFileSync("public/icon.svg", "utf8")
  .replace('<rect width="512" height="512" rx="112"', '<rect width="512" height="512"')
  .replace(
    "<g fill=\"#fff\">",
    '<g fill="#fff" transform="translate(51.2 51.2) scale(0.8)">',
  )
  .replace(
    '<g fill="#fff" opacity=".85">',
    '<g fill="#fff" opacity=".85" transform="translate(51.2 51.2) scale(0.8)">',
  );

mkdirSync("public/icons", { recursive: true });

for (const [out, file] of Object.entries(sources)) {
  const size = Number(out.match(/(\d+)/)[1]);
  const buf = await sharp(file, { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer();
  writeFileSync(`public/icons/${out}`, buf);
  console.log(`public/icons/${out} (${size}x${size})`);
}

const maskBuf = await sharp(Buffer.from(maskableSvg), { density: 300 })
  .resize(512, 512)
  .png()
  .toBuffer();
writeFileSync(maskable, maskBuf);
console.log(`${maskable} (512x512, maskable)`);

const apple = await sharp("public/icon.svg", { density: 300 })
  .resize(180, 180)
  .png()
  .toBuffer();
writeFileSync("public/apple-touch-icon.png", apple);
console.log("public/apple-touch-icon.png (180x180)");
