import "./style.css"
import { getCars, createCar, deleteCar, updateCar } from "./api"
import { renderCars } from "./render"
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

  const form = document.querySelector("#car-form") as HTMLFormElement

  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    const car = readCarFromForm()
    if (editingId === null) {
      await createCar(car)
    } else {
      await updateCar(editingId, car)
      editingId = null
    }

    form.reset()
    renderCars(await getCars())
  })

  const list = document.querySelector("#car-list") as HTMLDivElement

  list.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement

    if (target.classList.contains("delete-btn")) {
      await deleteCar(Number(target.dataset.id))
      renderCars(await getCars())
    }

    if (target.classList.contains("edit-btn")) {
      const id = Number(target.dataset.id)
      console.log(`here ${id}`)
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
})
