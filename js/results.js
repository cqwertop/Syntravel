import { flights } from "./data.js";
import { pickBest } from "./ai.js";

const resultsDiv = document.getElementById("results");
const ranked = pickBest(flights);

ranked.forEach((f, i) => {
  const div = document.createElement("div");
  div.className = "search-box";
  div.innerHTML = `
    <h3>${f.airline}</h3>
    <p>$${f.price} · ${f.duration}h</p>
    ${i === 0 ? "<strong>🧠 Best Value</strong>" : ""}
  `;
  resultsDiv.appendChild(div);
});
