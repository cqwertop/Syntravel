import { Card, CardContent } from "./components/ui/card.js";
import { Button } from "./components/ui/button.js";

const app = document.getElementById("app");

// Simple component creation
function createInput(placeholder, type = "text") {
  const input = document.createElement("input");
  input.placeholder = placeholder;
  input.type = type;
  input.className = "input";
  return input;
}

function createSelect(options) {
  const select = document.createElement("select");
  select.className = "input";
  options.forEach(opt => {
    const o = document.createElement("option");
    o.textContent = opt;
    select.appendChild(o);
  });
  return select;
}

// Build UI
const fromInput = createInput("From (City or Airport)");
const toInput = createInput("To (City or Airport)");
const departDate = createInput("Depart Date", "date");
const returnDate = createInput("Return Date", "date");
const travelersInput = createInput("Travelers", "number");
const cabinSelect = createSelect(["Economy", "Premium Economy", "Business", "First"]);

const searchBtn = Button("Find Best Trip", () => {
  console.log("Searching best trip:", {
    from: fromInput.value,
    to: toInput.value,
    departDate: departDate.value,
    returnDate: returnDate.value,
    travelers: travelersInput.value,
    cabin: cabinSelect.value,
  });
});

const aiBtn = Button("Let AI Decide", () => {
  console.log("AI deciding best combo...");
}, "button-secondary");

// Compose card
const card = Card(
  CardContent(
    (() => {
      const wrapper = document.createElement("div");
      wrapper.appendChild(fromInput);
      wrapper.appendChild(toInput);
      wrapper.appendChild(departDate);
      wrapper.appendChild(returnDate);
      wrapper.appendChild(travelersInput);
      wrapper.appendChild(cabinSelect);
      wrapper.appendChild(searchBtn);
      wrapper.appendChild(aiBtn);
      return wrapper;
    })()
  )
);

app.appendChild(card);
