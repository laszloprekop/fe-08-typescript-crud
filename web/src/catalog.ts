const CARS = [
  { brand: "Volvo", model: "142", year: 1972 },
  { brand: "Volvo", model: "164 E", year: 1973 },
  { brand: "Volvo", model: "1800 ES", year: 1973 },
  { brand: "Volvo", model: "244 GL", year: 1978 },
  { brand: "Volvo", model: "245 GLT", year: 1979 },
  { brand: "Volvo", model: "262C", year: 1978 },
  { brand: "Volvo", model: "740 Turbo", year: 1988 },
  { brand: "Volvo", model: "940 SE", year: 1993 },
  { brand: "Volvo", model: "850 T-5R", year: 1995 },
  { brand: "Saab", model: "Sonett III", year: 1972 },
  { brand: "Saab", model: "96 V4", year: 1975 },
  { brand: "Saab", model: "99 Turbo", year: 1978 },
  { brand: "Saab", model: "900 Turbo 16", year: 1985 },
  { brand: "Saab", model: "900 Cabriolet", year: 1990 },
  { brand: "Saab", model: "9000 Aero", year: 1994 },
  { brand: "Saab", model: "9-3 Viggen", year: 1999 },
  { brand: "Opel", model: "Kadett C", year: 1976 },
  { brand: "Opel", model: "Ascona B", year: 1977 },
  { brand: "Opel", model: "Manta B", year: 1980 },
  { brand: "Ford", model: "Capri II", year: 1975 },
  { brand: "Ford", model: "Taunus", year: 1976 },
  { brand: "Ford", model: "Escort RS2000", year: 1977 },
  { brand: "Ford", model: "Sierra XR4i", year: 1984 },
  { brand: "Volkswagen", model: "Golf GTI", year: 1979 },
]

const COLORS = [
  // the plain Swedish basics, as in the seed data
  "Blå",
  "Röd",
  "Vit",
  "Brun",
  "Grön",
  "Svart",
  "Gul",
  "Silver",
  // period paint names from the marques above
  "Safari Yellow",
  "Nautic Blue",
  "Cypress Green",
  "Talladega Red",
  "Edwardian Grey",
  "Monte Carlo Yellow",
  "Le Mans Blue",
  "Diamond White",
  "Signal Orange",
  "Strato Silver",
  "Mars Red",
  "British Racing Green",
]

export function randomCar() {
  return {
    ...CARS[Math.floor(Math.random() * CARS.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}
