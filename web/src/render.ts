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

const GROUPS = {
  light: { lMin: 0.8, lMax: 0.9, cMin: 0.03, cMax: 0.07 },
  mid: { lMin: 0.55, lMax: 0.68, cMin: 0.04, cMax: 0.1 },
  dark: { lMin: 0.26, lMax: 0.4, cMin: 0.03, cMax: 0.1 },
} as const
const ROTATION = ["light", "mid", "dark", "mid", "light", "dark"] as const

function hash(s: string): number {
  let h = 2166136260
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function paintFor(car: ICar): { css: string; light: boolean } {
  const h = hash((car.brand + " " + car.model).toLowerCase())
  const g =
    GROUPS[
      ROTATION[
        ((((car.id ?? 1) - 1) % ROTATION.length) + ROTATION.length) %
          ROTATION.length
      ]
    ]
  const hue = h % 360
  const L = g.lMin + (((h >> 9) & 255) / 255) * (g.lMax - g.lMin)
  const warm = hue < 70 || hue > 330
  let C = g.cMin + (((h >> 17) & 255) / 255) * (g.cMax - g.cMin)
  if (warm) C = Math.min(C + 0.04, 0.15) // reds and oranges carry more chroma
  return {
    css: `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${hue})`,
    light: L >= 0.6,
  }
}

export function buildCarCard(car: ICar): string {
  const tile = paintFor(car)
  const label = `${escapeHtml(car.brand)} ${escapeHtml(car.model)}`

  return `
    <article class="card group relative flex min-h-[320px] flex-col justify-end overflow-hidden text-white [isolation:isolate]"
             data-id="${escapeHtml(car.id)}"
             style="background-color: ${tile.css};"
             aria-label="${label}, ${escapeHtml(car.year)}, ${escapeHtml(car.color)}">
      <div class="car-ghost"></div>
      <span class="year-tab absolute left-1 top-1 z-[3] bg-black/20 px-2.5 py-1 font-mono text-lg font-bold tracking-wide text-white backdrop-blur-sm">${escapeHtml(car.year)}</span>

      <div class="tools absolute right-3 top-3 z-[3] flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button class="edit-btn grid size-[34px] place-items-center bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-ink" data-id="${escapeHtml(car.id)}" aria-label="Edit ${label}">
          <svg class="size-[17px]" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"/></svg>
        </button>
        <button class="delete-btn grid size-[34px] place-items-center bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-ink" data-id="${escapeHtml(car.id)}" aria-label="Delete ${label}">
          <svg class="size-[17px]" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/></svg>
        </button>
      </div>
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
