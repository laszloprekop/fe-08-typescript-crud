import "./style.css"
import { getCars, createCar, deleteCar, updateCar } from "./api"
import { renderCars } from "./render"
import { randomCar } from "./catalog"
import type { ICar } from "./types"

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
  const cars = await getCars()
  renderCars(cars)

  const themeBtn = document.querySelector("#theme-btn") as HTMLButtonElement
  themeBtn.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark"
    document.documentElement.setAttribute("data-theme", dark ? "light" : "dark")
  })

  const form = document.querySelector("#car-form") as HTMLFormElement

  form.addEventListener("submit", async (event) => {
    event.preventDefault()

    try {
      const car = readCarFromForm()
      if (editingId === null) {
        await createCar(car)
      } else {
        await updateCar(editingId, car)
        editingId = null
      }

      form.reset()
      renderCars(await getCars())
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      alert(`Save failed: ${message}`)
    }
  })

  const list = document.querySelector("#car-list") as HTMLDivElement

  list.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement

    const deleteBtn = target.closest(".delete-btn") as HTMLButtonElement | null
    if (deleteBtn) {
      await deleteCar(Number(deleteBtn.dataset.id))
      renderCars(await getCars())
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
