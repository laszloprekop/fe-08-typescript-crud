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
  const label = `${escapeHtml(car.brand)} ${escapeHtml(car.model)}`

  return `
    <article class="card group relative flex min-h-[320px] flex-col justify-end overflow-hidden text-white [isolation:isolate]"
             data-id="${escapeHtml(car.id)}"
             aria-label="${label}, ${escapeHtml(car.year)}, ${escapeHtml(car.color)}">
      <div class="car-ghost"></div>
      <span class="year-tab absolute left-3.5 top-3.5 z-[3] bg-black/40 px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-white backdrop-blur-sm">${escapeHtml(car.year)}</span>
      <div class="plate relative z-[2] p-[18px] [text-shadow:0_1px_3px_rgb(0_0_0/0.45)]">
        <div class="text-[26px] font-extrabold leading-[1.08] tracking-tight text-balance">${label}</div>
        <div class="mt-1.5 font-mono text-xs uppercase tracking-[0.1em] opacity-90">${escapeHtml(car.color)}</div>
      </div>
    </article>`
}

export function renderCars(cars: ICar[]): void {
  const list = document.querySelector("#car-list") as HTMLDivElement
  const count = document.querySelector("#count") as HTMLSpanElement
  count.textContent = `${String(cars.length)} ${cars.length === 1 ? "car" : "cars"} in the collection`
  list.innerHTML = cars.map(buildCarCard).join("")
}
