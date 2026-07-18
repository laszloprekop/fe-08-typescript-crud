export type ToastKind = "good" | "bad"

const BASE =
  "toast pointer-events-auto flex items-start gap-2.5 px-3.5 py-3 text-sm font-medium text-white shadow-[0_8px_30px_rgb(0_0_0_/_0.22)]"

export function showToast(message: string, kind: ToastKind): void {
  const region = document.querySelector(
    kind === "bad" ? "#toast-alert" : "#toast-status",
  ) as HTMLDivElement
  const el = document.createElement("div")
  el.className = `${BASE} ${kind}`

  const msg = document.createElement("span")
  msg.className = "flex-1"
  msg.textContent = message

  el.appendChild(msg)

  if (kind === "bad") {
    const closeBtn = document.createElement("button")
    closeBtn.className =
      "text-lg leading-none text-white/85 hover:text-white/100"
    closeBtn.setAttribute("aria-label", "Dismiss notification")
    closeBtn.textContent = "×"

    closeBtn.addEventListener("click", () => el.remove())
    el.appendChild(closeBtn)
  } else {
    setTimeout(() => el.remove(), 4000)
  }
  region.appendChild(el)
}
