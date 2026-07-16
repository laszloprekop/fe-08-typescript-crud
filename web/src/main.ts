import "./style.css"
import { getCars } from "./api"
import { renderCars } from "./render"

document.addEventListener("DOMContentLoaded", async () => {
  const cars = await getCars()
  console.log("Blep")
  renderCars(cars)
})
