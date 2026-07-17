// Spike: does Tailwind size/colour a Phosphor webfont icon the same way it
// does an inlined SVG?
//
// The box is not the question — `size-4` will always set the box. The question
// is whether the ICON ITSELF (the painted ink) scales with it. So we screenshot
// each icon and measure the bounding box of actually-painted red pixels.
//
// Run: node measure.mjs  (with `pnpm dev --port 5199` already running)
import { chromium } from "playwright";
import { PNG } from "pngjs";

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.goto("http://localhost:5199/", { waitUntil: "networkidle" });
await page.waitForTimeout(800); // webfont uses font-display: block

async function probe(id) {
  const styles = await page.evaluate((id) => {
    const el = document.getElementById(id);
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return {
      declaredBox: `${box.width.toFixed(0)}x${box.height.toFixed(0)}`,
      fontSize: cs.fontSize,
      color: cs.color,
    };
  }, id);

  // Measure the painted ink: bounding box of non-background pixels.
  const buf = await page.locator(`#${id}`).screenshot();
  const png = PNG.sync.read(buf);
  let minX = Infinity,
    minY = Infinity,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2;
      const [r, g, b, a] = [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
      const painted = a > 16 && !(r > 240 && g > 240 && b > 240);
      if (painted) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const ink = maxX < 0 ? "NOTHING PAINTED" : `${maxX - minX + 1}x${maxY - minY + 1}`;
  return { id, ...styles, paintedInk: ink };
}

const results = [];
for (const id of ["font-icon", "font-icon2", "font-icon3", "font-icon4", "svg-icon", "svg-icon3"]) {
  results.push(await probe(id));
}
console.table(results);

await page.screenshot({ path: "spike-render.png", fullPage: true });
await browser.close();
