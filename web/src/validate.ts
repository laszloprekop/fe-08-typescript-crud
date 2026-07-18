import type { ICar } from "./types"

export type CarErrors = Partial<
  Record<"brand" | "model" | "year" | "color", string>
>

export function validateCar(car: ICar): CarErrors {
  const errors: CarErrors = {}
  const brand = car.brand.trim()
  const model = car.model.trim()
  const color = car.color.trim()
  if (!brand) errors.brand = "Brand is required"
  else if (brand.length > 50)
    errors.brand = "Brand must be at most 50 characters"
  if (!model) errors.model = "Model is required"
  else if (model.length > 50)
    errors.model = "Model must be at most 50 characters"
  if (!color) errors.color = "Color is required"
  else if (color.length > 50)
    errors.color = "Color must be at most 50 characters"

  const maxYear = new Date().getFullYear() + 1
  if (!Number.isInteger(car.year) || car.year < 1886 || car.year > maxYear) {
    errors.year = `Year must be a valid integer between 1886 and ${maxYear}`
  }

  return errors
}
