import "./style.css"
import { getCars, createCar, deleteCar, updateCar } from "./api"
import { renderCars } from "./render"
import { randomCar } from "./catalog"
import { showToast } from "./toast"
import type { ICar } from "./types"
import { validateCar } from "./validate"

let editingId: number | null = null

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

    const deleteBtn = target.closest(".delete-btn") as HTMLButtonElement | null
    if (deleteBtn) {
      try {
        await deleteCar(Number(deleteBtn.dataset.id))
        renderCars(await getCars())
        showToast("Car deleted", "good")
      } catch (error: unknown) {
        showToast("Could not delete that car - is the API running?", "bad")
      }
    }

    const editBtn = target.closest(".edit-btn") as HTMLButtonElement | null
    if (editBtn) {
      const id = Number(editBtn.dataset.id)
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
