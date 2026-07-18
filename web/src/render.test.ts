import { describe, it, expect } from "vitest"
import { escapeHtml } from "./render"

describe("escapeHtml", () => {
  it("escapes a real XSS payload so it cannot execute", () => {
    expect(escapeHtml(`<img src=x onerror=alert(1)>`)).toBe(
      "&lt;img src=x onerror=alert(1)&gt;",
    )
  })
  it("escapes in a single pass (& is not double-encoded)", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b")
  })
  it("coerces non-strings rather than throwing, and leaves Swedish intact", () => {
    expect(escapeHtml(1978)).toBe("1978")
    expect(escapeHtml("Blå")).toBe("Blå")
  })
})
