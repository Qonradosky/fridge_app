const STORAGE_KEY = "virtual-fridge-items";
const PIN_KEY = "virtual-fridge-pin";
const SESSION_KEY = "virtual-fridge-unlocked";
const SOON_DAYS = 3;
const CATEGORY_GROUPS = {
  food: [
    "Nabial",
    "Warzywa",
    "Owoce",
    "Mieso",
    "Ryby",
    "Pieczywo",
    "Produkty suche",
    "Konserwy",
    "Mrozonki",
    "Gotowe dania",
    "Napoje",
    "Przyprawy",
    "Slodycze i przekaski",
  ],
  chemistry: ["Chemia gospodarcza", "Sprzatanie", "Higiena", "Papierowe", "Worki i folie", "Kosmetyki"],
  utility: ["Leki i suplementy", "Artykuly dla zwierzat", "Baterie", "Narzedzia i drobiazgi", "Inne zapasy"],
};
const CATEGORY_GROUP_LABELS = {
  food: "Jedzenie",
  chemistry: "Chemia",
  utility: "Użytkowe",
  other: "Inne",
};

const initialItems = [
  {
    id: crypto.randomUUID(),
    name: "Jogurt naturalny",
    price: 3.49,
    purchaseDate: toInputDate(new Date()),
    expirationDate: offsetDate(2),
    weight: 400,
    category: "Nabial",
    notes: "Do sniadan",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Pomidory malinowe",
    price: 8.2,
    purchaseDate: toInputDate(new Date()),
    expirationDate: offsetDate(5),
    weight: 700,
    category: "Warzywa",
    notes: "",
    createdAt: new Date().toISOString(),
  },
];

const elements = {
  authView: document.querySelector("#authView"),
  fridgeView: document.querySelector("#fridgeView"),
  pinForm: document.querySelector("#pinForm"),
  pinInput: document.querySelector("#pinInput"),
  pinHint: document.querySelector("#pinHint"),
  lockButton: document.querySelector("#lockButton"),
  notifyButton: document.querySelector("#notifyButton"),
  categoryTabs: document.querySelectorAll(".category-tab"),
  foodForm: document.querySelector("#foodForm"),
  foodId: document.querySelector("#foodId"),
  formTitle: document.querySelector("#formTitle"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  nameInput: document.querySelector("#nameInput"),
  priceInput: document.querySelector("#priceInput"),
  weightInput: document.querySelector("#weightInput"),
  purchaseDateInput: document.querySelector("#purchaseDateInput"),
  expirationDateInput: document.querySelector("#expirationDateInput"),
  noExpirationInput: document.querySelector("#noExpirationInput"),
  categoryInput: document.querySelector("#categoryInput"),
  notesInput: document.querySelector("#notesInput"),
  searchInput: document.querySelector("#searchInput"),
  filterInput: document.querySelector("#filterInput"),
  alerts: document.querySelector("#alerts"),
  foodList: document.querySelector("#foodList"),
  totalCount: document.querySelector("#totalCount"),
  soonCount: document.querySelector("#soonCount"),
  expiredCount: document.querySelector("#expiredCount"),
  totalValue: document.querySelector("#totalValue"),
  template: document.querySelector("#foodItemTemplate"),
};

let items = loadItems();
let activeCategoryGroup = "food";

setup();

function setup() {
  elements.purchaseDateInput.value = toInputDate(new Date());
  elements.expirationDateInput.value = offsetDate(7);
  bindEvents();
  showInitialView();
  registerServiceWorker();
}

function bindEvents() {
  elements.pinForm.addEventListener("submit", handlePinSubmit);
  elements.lockButton.addEventListener("click", lockApp);
  elements.notifyButton.addEventListener("click", requestNotifications);
  elements.foodForm.addEventListener("submit", handleFoodSubmit);
  elements.cancelEditButton.addEventListener("click", resetForm);
  elements.noExpirationInput.addEventListener("change", syncExpirationField);
  elements.categoryTabs.forEach((tab) => tab.addEventListener("click", handleCategoryTabClick));
  elements.searchInput.addEventListener("input", render);
  elements.filterInput.addEventListener("change", render);
}

function showInitialView() {
  const hasPin = Boolean(localStorage.getItem(PIN_KEY));
  const unlocked = sessionStorage.getItem(SESSION_KEY) === "true";

  if (!hasPin) {
    elements.pinHint.textContent = "Ustaw pierwszy domowy kod PIN.";
    showAuth();
    return;
  }

  if (unlocked) {
    showFridge();
    return;
  }

  elements.pinHint.textContent = "Wpisz domowy kod PIN.";
  showAuth();
}

function handlePinSubmit(event) {
  event.preventDefault();
  const pin = elements.pinInput.value.trim();
  const savedPin = localStorage.getItem(PIN_KEY);

  if (pin.length < 4) {
    elements.pinHint.textContent = "Kod powinien miec minimum 4 znaki.";
    return;
  }

  if (!savedPin) {
    localStorage.setItem(PIN_KEY, pin);
    sessionStorage.setItem(SESSION_KEY, "true");
    showFridge();
    return;
  }

  if (pin === savedPin) {
    sessionStorage.setItem(SESSION_KEY, "true");
    showFridge();
    return;
  }

  elements.pinHint.textContent = "Niepoprawny kod.";
}

function showAuth() {
  elements.fridgeView.hidden = true;
  elements.authView.hidden = false;
  elements.pinInput.value = "";
  elements.pinInput.focus();
}

function showFridge() {
  elements.authView.hidden = true;
  elements.fridgeView.hidden = false;
  render();
  maybeShowExpiryNotification();
}

function lockApp() {
  sessionStorage.removeItem(SESSION_KEY);
  showAuth();
}

function handleCategoryTabClick(event) {
  activeCategoryGroup = event.currentTarget.dataset.categoryGroup;
  elements.categoryTabs.forEach((tab) => {
    const isActive = tab.dataset.categoryGroup === activeCategoryGroup;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
  render();
}

function handleFoodSubmit(event) {
  event.preventDefault();
  const id = elements.foodId.value || crypto.randomUUID();
  const noExpiration = elements.noExpirationInput.checked;
  const payload = {
    id,
    name: elements.nameInput.value.trim(),
    price: Number(elements.priceInput.value),
    purchaseDate: elements.purchaseDateInput.value,
    expirationDate: noExpiration ? null : elements.expirationDateInput.value,
    weight: Number(elements.weightInput.value),
    category: elements.categoryInput.value,
    notes: elements.notesInput.value.trim(),
    createdAt: items.find((item) => item.id === id)?.createdAt || new Date().toISOString(),
  };

  if (!noExpiration && new Date(payload.expirationDate) < new Date(payload.purchaseDate)) {
    elements.expirationDateInput.setCustomValidity("Termin nie moze byc przed data zakupu.");
    elements.expirationDateInput.reportValidity();
    return;
  }

  elements.expirationDateInput.setCustomValidity("");
  items = items.some((item) => item.id === id)
    ? items.map((item) => (item.id === id ? payload : item))
    : [payload, ...items];
  saveItems();
  resetForm();
  render();
}

function resetForm() {
  elements.foodForm.reset();
  elements.foodId.value = "";
  elements.formTitle.textContent = "Dodaj produkt";
  elements.cancelEditButton.hidden = true;
  elements.purchaseDateInput.value = toInputDate(new Date());
  elements.expirationDateInput.value = offsetDate(7);
  elements.noExpirationInput.checked = false;
  syncExpirationField();
  elements.categoryInput.value = "Nabial";
}

function editItem(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  elements.foodId.value = item.id;
  elements.nameInput.value = item.name;
  elements.priceInput.value = item.price;
  elements.weightInput.value = item.weight;
  elements.purchaseDateInput.value = item.purchaseDate;
  elements.noExpirationInput.checked = !item.expirationDate;
  elements.expirationDateInput.value = item.expirationDate || offsetDate(7);
  syncExpirationField();
  elements.categoryInput.value = item.category;
  elements.notesInput.value = item.notes;
  elements.formTitle.textContent = "Edytuj produkt";
  elements.cancelEditButton.hidden = false;
  elements.nameInput.focus();
}

function deleteItem(id) {
  items = items.filter((item) => item.id !== id);
  saveItems();
  render();
}

function render() {
  const enriched = items
    .map((item) => ({
      ...item,
      categoryGroup: getCategoryGroup(item.category),
      status: getStatus(item),
      daysLeft: getDaysLeft(item.expirationDate),
    }))
    .sort((a, b) => getSortDate(a.expirationDate) - getSortDate(b.expirationDate));
  const filtered = filterItems(enriched);

  renderStats(filtered);
  renderAlerts(filtered);
  renderList(filtered);
}

function renderStats(source) {
  elements.totalCount.textContent = source.length;
  elements.soonCount.textContent = source.filter((item) => item.status === "soon").length;
  elements.expiredCount.textContent = source.filter((item) => item.status === "expired").length;
  elements.totalValue.textContent = formatCurrency(source.reduce((sum, item) => sum + item.price, 0));
}

function renderAlerts(source) {
  const urgent = source.filter((item) => item.status === "soon" || item.status === "expired");
  elements.alerts.replaceChildren();

  urgent.slice(0, 3).forEach((item) => {
    const alert = document.createElement("div");
    alert.className = "alert";
    alert.textContent = item.status === "expired"
      ? `${item.name}: termin minal ${Math.abs(item.daysLeft)} dni temu.`
      : `${item.name}: zostalo ${item.daysLeft} dni.`;
    elements.alerts.append(alert);
  });
}

function renderList(source) {
  elements.foodList.replaceChildren();

  if (!source.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Brak produktow na tej liscie.";
    elements.foodList.append(empty);
    return;
  }

  source.forEach((item) => {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    node.classList.add(item.status);
    node.querySelector("h3").textContent = item.name;
    node.querySelector(".food-meta").textContent = `${CATEGORY_GROUP_LABELS[item.categoryGroup]} - ${item.category} - ${item.weight} g/ml - ${formatCurrency(item.price)}`;
    node.querySelector(".food-details").textContent = getStatusText(item);
    node.querySelector(".edit").addEventListener("click", () => editItem(item.id));
    node.querySelector(".delete").addEventListener("click", () => deleteItem(item.id));
    elements.foodList.append(node);
  });
}

function filterItems(source) {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filter = elements.filterInput.value;

  return source.filter((item) => {
    const matchesQuery = [item.name, item.category, item.notes].some((field) => field.toLowerCase().includes(query));
    const matchesFilter = filter === "all" || item.status === filter;
    const matchesCategoryGroup = item.categoryGroup === activeCategoryGroup;
    return matchesQuery && matchesFilter && matchesCategoryGroup;
  });
}

function getCategoryGroup(category) {
  const group = Object.entries(CATEGORY_GROUPS).find(([, categories]) => categories.includes(category));
  return group ? group[0] : "other";
}

function getStatus(item) {
  if (!item.expirationDate) return "no-expiry";
  const daysLeft = getDaysLeft(item.expirationDate);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= SOON_DAYS) return "soon";
  return "fresh";
}

function getStatusText(item) {
  if (item.status === "no-expiry") return "Bez terminu waznosci";
  if (item.status === "expired") return `Po terminie od ${Math.abs(item.daysLeft)} dni`;
  if (item.daysLeft === 0) return "Termin mija dzisiaj";
  if (item.status === "soon") return `Zostalo ${item.daysLeft} dni`;
  return `Wazne do ${formatDate(item.expirationDate)}`;
}

function getDaysLeft(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  const target = new Date(dateValue);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function getSortDate(dateValue) {
  return dateValue ? new Date(dateValue).getTime() : Number.MAX_SAFE_INTEGER;
}

function syncExpirationField() {
  const disabled = elements.noExpirationInput.checked;
  elements.expirationDateInput.disabled = disabled;
  elements.expirationDateInput.required = !disabled;
  elements.expirationDateInput.setCustomValidity("");
}

async function requestNotifications() {
  if (!("Notification" in window)) {
    alert("Ta przegladarka nie obsluguje powiadomien.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    maybeShowExpiryNotification(true);
  }
}

function maybeShowExpiryNotification(force = false) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const relevant = items
    .map((item) => ({ ...item, status: getStatus(item), daysLeft: getDaysLeft(item.expirationDate) }))
    .filter((item) => item.status === "soon" || item.status === "expired");
  const todayKey = `virtual-fridge-notified-${toInputDate(new Date())}`;

  if (!force && localStorage.getItem(todayKey) === "true") return;
  if (!relevant.length && !force) return;

  const body = relevant.length
    ? `${relevant.length} produktow wymaga uwagi. Najpilniej: ${relevant[0].name}.`
    : "Powiadomienia sa wlaczone.";

  new Notification("Lodowka wirtualna", { body });
  localStorage.setItem(todayKey, "true");
}

function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialItems;

  try {
    return JSON.parse(saved);
  } catch {
    return initialItems;
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateValue));
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
