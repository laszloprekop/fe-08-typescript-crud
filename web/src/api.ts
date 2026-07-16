import type { ICar } from "./types"

const API_URL: string = import.meta.env.VITE_API_URL

export async function getCars(): Promise<ICar[]> {
  return [{ id: 1, brand: "Volvo", model: "244 GL", year: 1978, color: "Blå" }]
}
