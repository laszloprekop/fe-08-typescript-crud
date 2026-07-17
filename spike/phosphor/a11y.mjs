// Spike: what accessible NAME does each Edit/Delete button variant actually get?
// Uses Chromium's own accessible-name computation (the same engine a screen
// reader consumes), not our reading of the spec.
//
// Run: node a11y.mjs  (with `pnpm dev --port 5199` already running)
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:5199/a11y.html", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const CASES = {
  a1: "webfont, icon-only, no aria at all",
  a2: "webfont, icon-only, icon aria-hidden, no label",
  a3: "webfont, icon-only, aria-hidden + aria-label",
  a4: "webfont + visible text, icon aria-hidden",
  a5: "webfont + visible text, icon NOT hidden",
  a6: "svg, icon-only, no aria at all",
  a7: "svg, icon-only, aria-hidden + aria-label",
  a8: "svg + visible text, icon aria-hidden",
  a9: "visible text 'Delete' + mismatched aria-label",
};

const cdp = await page.context().newCDPSession(page);
await cdp.send("DOM.enable");
await cdp.send("Accessibility.enable");
const { root } = await cdp.send("DOM.getDocument");

const rows = [];
for (const [id, desc] of Object.entries(CASES)) {
  // Chromium's own computed accessible name, straight from the AX tree.
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: `#${id}`,
  });
  const { nodes } = await cdp.send("Accessibility.getPartialAXTree", {
    nodeId,
    fetchRelatives: false,
  });
  const name = nodes[0]?.name?.value ?? "";
  // Show the raw codepoints so a Private Use Area glyph is visible, not blank.
  const codepoints = [...name]
    .map((c) => {
      const cp = c.codePointAt(0);
      return cp > 0xe000 && cp < 0xf8ff ? `U+${cp.toString(16).toUpperCase()}(PUA)` : c;
    })
    .join("");
  rows.push({
    id,
    case: desc,
    accessibleName: name === "" ? "(EMPTY — unusable)" : codepoints,
  });
}
console.table(rows);
await browser.close();
