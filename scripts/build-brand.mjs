import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const dir = "public/brand";
await mkdir(dir, { recursive: true });
const ink = "#202b29",
  ivory = "#f5f2eb";
// Original, grid-built vector geometry. Two opposing open corners hold a shared space.
const held =
  '<path d="M8 8H48L40 16H16V40L8 48ZM56 56H16L24 48H48V24L56 16Z"/>';
const fold =
  '<path d="M12 8H48L30 32L48 56H12L30 32ZM23 16L36 32L23 48H33L45 32L33 16Z" fill-rule="evenodd"/>';
const echo =
  '<path d="M8 44V28A24 24 0 0 1 56 28V44H48V28A16 16 0 0 0 16 28V44ZM24 56V28A8 8 0 0 1 40 28V56H32V28H31V56Z"/>';
const svg = (body, color = ink, viewBox = "0 0 64 64") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${color}">${body}</svg>`;
const glyphs = {
  Z: "M0 0H25V5L7 27H25V32H0V27L18 5H0Z",
  E: "M0 0H24V5H6V13H21V18H6V27H24V32H0Z",
  M: "M0 32V0H6L15 18L24 0H30V32H24V11L15 27L6 11V32Z",
  N: "M0 32V0H6L23 22V0H29V32H23L6 10V32Z",
};
let x = 0;
const letters = [..."ZEMNE"]
  .map((letter) => {
    const p = `<path transform="translate(${x} 0)" d="${glyphs[letter]}"/>`;
    x += letter === "M" ? 43 : letter === "N" ? 42 : 38;
    return p;
  })
  .join("");
const wordmark = `<g transform="translate(83 16)">${letters}</g>`;
for (const [name, color] of [
  ["primary", ink],
  ["dark", ink],
  ["light", ivory],
])
  await writeFile(
    `${dir}/zemne-logo-${name}.svg`,
    svg(held + wordmark, color, "0 0 282 64"),
  );
await writeFile(`${dir}/zemne-mark.svg`, svg(held));
await writeFile(`${dir}/zemne-wordmark.svg`, svg(letters, ink, "0 0 190 32"));
for (const [name, body] of [
  ["held-space", held],
  ["folded-continuum", fold],
  ["resonance", echo],
])
  await writeFile(`${dir}/concept-${name}.svg`, svg(body));
const favicon = svg(
  `<rect width="64" height="64" rx="14" fill="${ink}"/><g fill="${ivory}" transform="translate(6 6) scale(.8125)">${held}</g>`,
);
await writeFile("public/favicon.svg", favicon);
for (const size of [16, 32, 180, 192, 512])
  await sharp(Buffer.from(favicon))
    .resize(size, size)
    .png()
    .toFile(`${dir}/icon-${size}.png`);
const png = await sharp(Buffer.from(favicon)).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await writeFile("public/favicon.ico", Buffer.concat([header, png]));
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="920" viewBox="0 0 1440 920"><rect width="1440" height="920" fill="${ivory}"/><g fill="${ink}" font-family="Arial"><text x="72" y="83" font-size="15" letter-spacing="4">ZEMNE / IDENTITY STUDY 01</text><text x="72" y="151" font-family="Georgia" font-size="46">A space for what stays.</text>${[
  ["01 / THE HELD SPACE", held, "Opposing corners. A shared presence."],
  ["02 / FOLDED CONTINUUM", fold, "One memory becomes the next."],
  ["03 / RESONANCE", echo, "An impression that carries outward."],
]
  .map(
    ([title, body, note], i) =>
      `<g transform="translate(${72 + i * 448} 220)"><rect width="400" height="340" rx="4" fill="#e9e5dc"/><g transform="translate(132 50) scale(2.1)">${body}</g><text x="28" y="245" font-size="15" letter-spacing="1">${title}</text><text x="28" y="285" font-size="14">${note}</text></g>`,
  )
  .join(
    "",
  )}<text x="72" y="632" font-size="14" letter-spacing="3">SELECTED / THE HELD SPACE</text><g transform="translate(72 672)">${held + wordmark}</g><g transform="translate(72 798)"><rect width="496" height="64" rx="4" fill="${ink}"/><g fill="${ivory}" transform="translate(20 0)">${held + wordmark}</g></g><text x="705" y="702" font-size="14">Actual favicon sizes / 16 · 32 · 180</text><g transform="translate(705 734) scale(.25)">${held}</g><g transform="translate(754 726) scale(.5)">${held}</g><g transform="translate(858 718) scale(2.8125)">${held}</g></g></svg>`;
await writeFile(`${dir}/identity-study.svg`, sheet);
await sharp(Buffer.from(sheet)).png().toFile(`${dir}/identity-study.png`);
await mkdir("public/assets", { recursive: true });
for (let i = 1; i <= 3; i++) {
  const colors = [
    ["#b8c0b4", "#e3d9c5", "#7a8a78"],
    ["#b4bebf", "#e7dbbf", "#7e8d8c"],
    ["#c8bcae", "#e7d5be", "#9a8d78"],
  ][i - 1];
  const art = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><clipPath id="a"><path d="M40 460V190a160 160 0 0 1 320 0v270Z"/></clipPath></defs><rect width="400" height="500" fill="#eee7da"/><g clip-path="url(#a)"><rect width="400" height="500" fill="${colors[0]}"/><circle cx="260" cy="155" r="44" fill="${colors[1]}"/><path d="M0 330Q160 160 400 340V500H0Z" fill="${colors[2]}"/><path d="M0 420Q230 270 400 390V500H0Z" fill="${colors[1]}"/></g></svg>`;
  await writeFile(`public/assets/neutral-${i}.svg`, art);
}
console.log(
  "Brand vectors, identity study, ICO, PNG icons and 3 neutral artworks generated.",
);
