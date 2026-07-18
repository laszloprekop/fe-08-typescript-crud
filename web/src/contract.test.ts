import { describe, it, expect } from "vitest"
import fixture from "./cars.fixture.json"
import type { ICar } from "./types"

describe("GET /api/cars contract", () => {
  it("delivers camelCase keys matching ICar", () => {
    for (const c of fixture as ICar[]) {
      expect(Object.keys(c).sort()).toEqual([
        "brand",
        "color",
        "id",
        "model",
        "year",
      ])
      expect(typeof c.year).toBe("number")
    }
  })
})
