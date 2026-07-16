import type { ICar } from "./types"

const API_URL: string = import.meta.env.VITE_API_URL

export async function getCars(): Promise<ICar[]> {
  const response = await fetch(API_URL)
  if (!response.ok) throw new Error(`GET filed: ${response.status}`)
  return await response.json()
}

export async function createCar(car: ICar): Promise<void> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(car),
  })
  if (!response.ok) throw new Error(`Post failed: ${response.status}`)
}
