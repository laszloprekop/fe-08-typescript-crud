// web/src/validate.test.ts  (new file)
import { describe, it, expect } from "vitest"
import { validateCar } from "./validate"
import type { ICar } from "./types"

const ok: ICar = { brand: "Volvo", model: "244 GL", year: 1978, color: "Blå" }

describe("validateCar", () => {
  it("passes a valid car", () => expect(validateCar(ok)).toEqual({}))
  it("rejects a whitespace-only brand", () =>
    expect(validateCar({ ...ok, brand: "   " }).brand).toBeDefined())
  it("rejects a year before 1886", () =>
    expect(validateCar({ ...ok, year: 1800 }).year).toBeDefined())
})
