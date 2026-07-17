import type { ICar } from "./types"

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])
}

export function buildCarCard(car: ICar): string {
  return `
  <article>
    <h3>${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h3>
    <p>${escapeHtml(car.year)} • ${escapeHtml(car.color)}</p>
    <button class="edit-btn" data-id="${escapeHtml(car.id)}">Edit</button>
    <button class="delete-btn" data-id="${escapeHtml(car.id)}">Delete</button>
  </article>`
}

export function renderCars(cars: ICar[]): void {
  const list = document.querySelector("#car-list") as HTMLDivElement
  list.innerHTML = cars.map(buildCarCard).join("")
}
