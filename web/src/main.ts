import "./style.css"
import { getCars, createCar, deleteCar, updateCar } from "./api"
import { renderCars } from "./render"
import { randomCar } from "./catalog"
import { showToast } from "./toast"
import type { ICar } from "./types"
import { validateCar } from "./validate"

let editingId: number | null = null
let confirmingId: number | null = null

function readCarFromForm(): ICar {
  const brand = document.querySelector("#brand") as HTMLInputElement
  const model = document.querySelector("#model") as HTMLInputElement
  const year = document.querySelector("#year") as HTMLInputElement
  const color = document.querySelector("#color") as HTMLInputElement

  return {
    brand: brand.value,
    model: model.value,
    year: Number(year.value),
    color: color.value,
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    renderCars(await getCars())
  } catch (error) {
    showToast("Could not reach the server - is the API running?", "bad")
  }

  const themeBtn = document.querySelector("#theme-btn") as HTMLButtonElement
  themeBtn.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark"
    document.documentElement.setAttribute("data-theme", dark ? "light" : "dark")
  })

  const form = document.querySelector("#car-form") as HTMLFormElement

  form.addEventListener("submit", async (event) => {
    event.preventDefault()

    try {
      const wasEditing = editingId !== null
      const car = readCarFromForm()
      const errors = validateCar(car)
      ;(["brand", "model", "year", "color"] as const).forEach((f) => {
        ;(document.querySelector(`#${f}`) as HTMLInputElement).classList.toggle(
          "bad",
          f in errors,
        )
      })
      const firstError = Object.values(errors)[0]
      if (firstError) {
        showToast(firstError, "bad")
        return
      }

      if (editingId === null) {
        await createCar(car)
      } else {
        await updateCar(editingId, car)
        editingId = null
      }
      form.reset()
      renderCars(await getCars())
      showToast(wasEditing ? "Car updated" : "Car saved", "good")
    } catch (error: unknown) {
      showToast("The server rejected that - check your entries.", "bad")
    }
  })

  const list = document.querySelector("#car-list") as HTMLDivElement

  list.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement

    const card = target.closest(".card") as HTMLElement | null
    if (!card) return
    const id = Number(card.dataset.id)

    if (target.closest(".delete-btn")) {
      confirmingId = id
      renderCars(await getCars(), confirmingId)
    } else if (target.closest(".cancel-delete-btn")) {
      confirmingId = null
      renderCars(await getCars(), confirmingId)
    } else if (target.closest(".confirm-delete-btn")) {
      try {
        await deleteCar(id)
        if (editingId === id) {
          editingId = null
          form.reset()
        }
        confirmingId = null
        renderCars(await getCars(), confirmingId)
        showToast("Car deleted", "good")
      } catch (error: unknown) {
        showToast("Could not delete that car - is the API running?", "bad")
      }
    } else if (target.closest(".edit-btn")) {
      const car = (await getCars()).find((c) => c.id === id)
      if (!car) return
      ;(document.querySelector("#brand") as HTMLInputElement).value = car.brand
      ;(document.querySelector("#model") as HTMLInputElement).value = car.model
      ;(document.querySelector("#year") as HTMLInputElement).value = String(
        car.year,
      )
      ;(document.querySelector("#color") as HTMLInputElement).value = car.color
      editingId = id
    }
  })

  document.addEventListener("keydown", async (event) => {
    if (event.key === "Escape" && confirmingId !== null) {
      confirmingId = null
      renderCars(await getCars(), confirmingId)
    }
  })

  const cancelBtn = document.querySelector("#cancel-btn") as HTMLButtonElement

  cancelBtn.addEventListener("click", () => {
    editingId = null
    form.reset()
  })

  const randomBtn = document.querySelector("#random-btn") as HTMLButtonElement

  randomBtn.addEventListener("click", () => {
    const car = randomCar()
    ;(document.querySelector("#brand") as HTMLInputElement).value = car.brand
    ;(document.querySelector("#model") as HTMLInputElement).value = car.model
    ;(document.querySelector("#year") as HTMLInputElement).value = String(
      car.year,
    )
    ;(document.querySelector("#color") as HTMLInputElement).value = car.color
  })
})
