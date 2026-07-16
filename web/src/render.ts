import type { ICar } from "./types"

export function buildCarCard(car: ICar): string {
  return `<article><h3>${car.brand} ${car.model}</h3>
  <p>${car.year} • ${car.color}</p><article>`
}

export function renderCars(cars: ICar[]): void {
  const list = document.querySelector("#car-list") as HTMLDivElement
  list.innerHTML = cars.map(buildCarCard).join("")
}
