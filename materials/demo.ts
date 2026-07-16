// ============================================================================
// Hjälpfunktion för att logga till vår "skärm-konsol" i HTML:en
// ============================================================================
function logToScreen(message: string): void {
    const consoleBox = document.querySelector("#screen-console") as HTMLDivElement;
    if (consoleBox) {
        consoleBox.innerText = `[LOGG] ${message}\n` + consoleBox.innerText;
    }
    console.log(message);
}


// ============================================================================
// 1. DEMO: Grundläggande Typer och Typade Funktioner
// ============================================================================
// Vi definierar typer på parametrarna (:string, :number) och returtypen (:string)
function formatGreeting(name: string, age: number): string {
    return `Hej, jag heter ${name} och är ${age} år gammal!`;
}

function runGreetingDemo(): void {
    // Berätta och visa vad som händer om man skickar in fel datatyp i editorn
    const greetingText = formatGreeting("Anna", 28);
    logToScreen(greetingText);
}


// ============================================================================
// 2. DEMO: Interfaces (Strukturerade objekt)
// ============================================================================
interface IDemoCar {
    id?: number; // Valfri (optional) egenskap
    brand: string;
    model: string;
    year: number;
}

function runCarDemo(): void {
    // Visa hur vi får autocomplete på egenskaperna när vi skriver "nyBil."
    const nyBil: IDemoCar = {
        brand: "Tesla",
        model: "Model Y",
        year: 2023
    };

    logToScreen(`Skapade bil-objekt: ${nyBil.brand} ${nyBil.model} (${nyBil.year})`);
}


// ============================================================================
// 3. DEMO: DOM-casting (Hur vi hämtar element och undviker röda linjer)
// ============================================================================
function runInputDemo(): void {
    // UTAN CASTING (JS-stil):
    // const input = document.querySelector("#demo-input");
    // console.log(input.value); // <-- Detta ger rött streck i TS eftersom TS inte vet elementets typ!

    // MED CASTING: Vi talar om för kompilatorn exakt vad det är för element
    const myInput = document.querySelector("#demo-input") as HTMLInputElement;

    if (myInput) {
        // Nu förstår TypeScript att `.value` existerar utan problem!
        const value: string = myInput.value;
        logToScreen(`Läst från input: "${value}"`);
    } else {
        logToScreen("Kunde inte hitta elementet #demo-input!");
    }
}


// ============================================================================
// Initiering: Koppla eventlyssnare på modul-vänligt sätt
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    const btnGreet = document.querySelector("#btn-greet") as HTMLButtonElement | null;
    const btnCar = document.querySelector("#btn-car") as HTMLButtonElement | null;
    const btnReadInput = document.querySelector("#btn-read-input") as HTMLButtonElement | null;

    if (btnGreet) {
        btnGreet.addEventListener("click", runGreetingDemo);
    }
    if (btnCar) {
        btnCar.addEventListener("click", runCarDemo);
    }
    if (btnReadInput) {
        btnReadInput.addEventListener("click", runInputDemo);
    }
});