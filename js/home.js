window.TRAVEL_API_CONFIG = {
  baseUrl: "",
  endpoint: "/search",
  apiKey: ""
};

const state = {
  type: "packages"
};

const form = document.getElementById("searchForm");
const aiButton = document.getElementById("aiButton");
const tabs = document.querySelectorAll(".tab");
const typeInput = form.elements.type;
const loginBtn = document.getElementById("loginBtn");
const signInBtn = document.getElementById("signInBtn");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((el) => {
      el.classList.remove("active");
      el.setAttribute("aria-selected", "false");
    });

    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    state.type = tab.dataset.type;
    typeInput.value = state.type;
  });
});

aiButton.addEventListener("click", () => {
  const destinations = ["Barcelona", "Lisbon", "Tokyo", "Dubai", "Vancouver"];
  const pick = destinations[Math.floor(Math.random() * destinations.length)];
  form.elements.to.value = pick;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const params = new URLSearchParams({
    type: typeInput.value,
    from: form.elements.from.value.trim(),
    to: form.elements.to.value.trim(),
    departDate: form.elements.departDate.value,
    returnDate: form.elements.returnDate.value,
    travelers: String(Number(form.elements.travelers.value || 1)),
    directOnly: String(form.elements.directOnly.checked),
    refundable: String(form.elements.refundable.checked)
  });

  window.location.href = `results.html?${params.toString()}`;
});

function handleAuthClick(mode) {
  const target = mode === "login" ? "Login" : "Sign in";
  alert(`${target} flow placeholder. Connect this button to your auth provider.`);
}

loginBtn.addEventListener("click", () => handleAuthClick("login"));
signInBtn.addEventListener("click", () => handleAuthClick("signin"));
