import "./style.css"
import { getCars, createCar } from "./api"
import { renderCars } from "./render"
import type { ICar } from "./types"

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
    await createCar(readCarFromForm())
    form.reset()
    renderCars(await getCars())
  })
})
