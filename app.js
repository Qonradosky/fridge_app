const STORAGE_KEY = "virtual-fridge-items";
const SHOPPING_KEY = "virtual-fridge-shopping-items";
const PIN_KEY = "virtual-fridge-pin";
const SESSION_KEY = "virtual-fridge-unlocked";
const HOUSEHOLD_KEY = "virtual-fridge-household-id";
const THEME_KEY = "virtual-fridge-theme";
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
  utility: ["Leki i suplementy", "Artykuly dla zwierzat", "Baterie", "Narzedzia i drobiazgi", "Inne zapasy", "Inne"],
};

const CATEGORY_GROUP_LABELS = {
  food: "Spozywcze",
  chemistry: "Dom i chemia",
  utility: "Uzyteczne zapasy",
};

const initialItems = [
  createSeedItem("Jogurt naturalny", 3.49, -2, 2, 400, "g/ml", "Nabial", "Do sniadan"),
  createSeedItem("Pomidory malinowe", 8.2, -1, 5, 700, "g/ml", "Warzywa", ""),
  createSeedItem("Mleko 2%", 4.29, -4, 3, 1, "szt", "Nabial", "Karton"),
  createSeedItem("Mleko 2%", 4.49, -1, 9, 1, "szt", "Nabial", "Do kawy"),
  createSeedItem("Jajka", 11.99, -3, 12, 10, "szt", "Nabial", "Rozmiar M"),
  createSeedItem("Chleb zytni", 6.5, -1, 1, 1, "szt", "Pieczywo", ""),
  createSeedItem("Pierogi ruskie", 13.99, -10, 25, 450, "g/ml", "Mrozonki", "Awaryjny obiad", true, -8),
  createSeedItem("Kurczak filet", 18.4, -12, 35, 600, "g/ml", "Mieso", "Porcjowany", true, -11),
  createSeedItem("Plyn do naczyn", 7.99, -7, null, 1, "szt", "Chemia gospodarcza", "Cytrynowy"),
  createSeedItem("Worki na smieci", 12.49, -20, null, 1, "szt", "Worki i folie", "60 l"),
  createSeedItem("Baterie AA", 16.99, -30, null, 8, "szt", "Baterie", ""),
  createSeedItem("Witamina D", 22.9, -14, 160, 1, "szt", "Leki i suplementy", "Po sniadaniu"),
];

const elements = {
  authView: document.querySelector("#authView"),
  fridgeView: document.querySelector("#fridgeView"),
  pinForm: document.querySelector("#pinForm"),
  pinInput: document.querySelector("#pinInput"),
  pinHint: document.querySelector("#pinHint"),
  cloudAuthForm: document.querySelector("#cloudAuthForm"),
  emailInput: document.querySelector("#emailInput"),
  passwordInput: document.querySelector("#passwordInput"),
  householdCodeInput: document.querySelector("#householdCodeInput"),
  signInButton: document.querySelector("#signInButton"),
  signUpButton: document.querySelector("#signUpButton"),
  cloudAuthHint: document.querySelector("#cloudAuthHint"),
  lockButton: document.querySelector("#lockButton"),
  notifyButton: document.querySelector("#notifyButton"),
  themeToggleButton: document.querySelector("#themeToggleButton"),
  categoryTabs: document.querySelectorAll(".category-tab"),
  foodForm: document.querySelector("#foodForm"),
  foodId: document.querySelector("#foodId"),
  formTitle: document.querySelector("#formTitle"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  nameInput: document.querySelector("#nameInput"),
  priceInput: document.querySelector("#priceInput"),
  weightInput: document.querySelector("#weightInput"),
  unitInput: document.querySelector("#unitInput"),
  purchaseDateInput: document.querySelector("#purchaseDateInput"),
  expirationDateInput: document.querySelector("#expirationDateInput"),
  noExpirationInput: document.querySelector("#noExpirationInput"),
  frozenInput: document.querySelector("#frozenInput"),
  frozenDateInput: document.querySelector("#frozenDateInput"),
  categoryInput: document.querySelector("#categoryInput"),
  notesInput: document.querySelector("#notesInput"),
  searchInput: document.querySelector("#searchInput"),
  filterInput: document.querySelector("#filterInput"),
  shoppingToggleButton: document.querySelector("#shoppingToggleButton"),
  seedShoppingButton: document.querySelector("#seedShoppingButton"),
  exportShoppingButton: document.querySelector("#exportShoppingButton"),
  shoppingPanel: document.querySelector("#shoppingPanel"),
  shoppingForm: document.querySelector("#shoppingForm"),
  shoppingNameInput: document.querySelector("#shoppingNameInput"),
  shoppingAmountInput: document.querySelector("#shoppingAmountInput"),
  shoppingUnitInput: document.querySelector("#shoppingUnitInput"),
  shoppingExportOutput: document.querySelector("#shoppingExportOutput"),
  articleSuggestions: document.querySelector("#articleSuggestions"),
  shoppingList: document.querySelector("#shoppingList"),
  subcategoryFilters: document.querySelector("#subcategoryFilters"),
  alerts: document.querySelector("#alerts"),
  foodList: document.querySelector("#foodList"),
  totalCount: document.querySelector("#totalCount"),
  soonCount: document.querySelector("#soonCount"),
  expiredCount: document.querySelector("#expiredCount"),
  totalValue: document.querySelector("#totalValue"),
  template: document.querySelector("#foodItemTemplate"),
};

let items = loadItems();
let shoppingItems = loadShoppingItems();
let activeCategoryGroups = new Set(["food"]);
let activeSubcategories = new Set();
let supabaseClient = null;
let householdId = localStorage.getItem(HOUSEHOLD_KEY) || "";
let useCloud = false;

setup();

async function setup() {
  applySavedTheme();
  elements.purchaseDateInput.value = toInputDate(new Date());
  elements.expirationDateInput.value = offsetDate(7);
  elements.frozenDateInput.value = toInputDate(new Date());
  bindEvents();
  renderSubcategoryFilters();
  renderShopping();
  await initializeCloud();
  await showInitialView();
  registerServiceWorker();
}

function bindEvents() {
  elements.pinForm.addEventListener("submit", handlePinSubmit);
  elements.signInButton.addEventListener("click", () => handleCloudAuth("signin"));
  elements.signUpButton.addEventListener("click", () => handleCloudAuth("signup"));
  elements.lockButton.addEventListener("click", lockApp);
  elements.notifyButton.addEventListener("click", requestNotifications);
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.foodForm.addEventListener("submit", handleFoodSubmit);
  elements.cancelEditButton.addEventListener("click", resetForm);
  elements.noExpirationInput.addEventListener("change", syncExpirationField);
  elements.frozenInput.addEventListener("change", syncFrozenField);
  elements.categoryTabs.forEach((tab) => tab.addEventListener("click", handleCategoryTabClick));
  elements.searchInput.addEventListener("input", render);
  elements.filterInput.addEventListener("change", render);
  elements.shoppingToggleButton.addEventListener("click", toggleShoppingPanel);
  elements.seedShoppingButton.addEventListener("click", seedShoppingFromProducts);
  elements.exportShoppingButton.addEventListener("click", exportShoppingList);
  elements.shoppingForm.addEventListener("submit", handleShoppingSubmit);
}

async function initializeCloud() {
  const config = window.SUPABASE_CONFIG || {};
  useCloud = Boolean(config.url && config.anonKey);

  if (!useCloud) {
    elements.pinForm.hidden = false;
    elements.cloudAuthForm.hidden = true;
    return;
  }

  elements.pinForm.hidden = true;
  elements.cloudAuthForm.hidden = false;

  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    useCloud = false;
    elements.pinForm.hidden = false;
    elements.cloudAuthForm.hidden = true;
    elements.pinHint.textContent = "Nie udalo sie zaladowac Supabase. Dziala tryb lokalny.";
    console.error(error);
  }
}

async function showInitialView() {
  if (useCloud) {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      await ensureHouseholdAfterLogin();
      if (householdId) {
        await loadCloudData();
        showFridge();
        return;
      }
    }

    elements.cloudAuthHint.textContent = "Zaloguj sie i wpisz wspolny kod domu.";
    showAuth();
    return;
  }

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

async function handleCloudAuth(mode) {
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value;
  const inviteCode = normalizeInviteCode(elements.householdCodeInput.value);

  if (!email || !password || !inviteCode) {
    elements.cloudAuthHint.textContent = "Podaj email, haslo i kod domu.";
    return;
  }

  elements.cloudAuthHint.textContent = "Lacze z Supabase...";

  try {
    if (mode === "signup") {
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
      await supabaseClient.auth.signInWithPassword({ email, password });
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }

    await joinOrCreateHousehold(inviteCode);
    await migrateLocalDataToCloud();
    await loadCloudData();
    showFridge();
  } catch (error) {
    elements.cloudAuthHint.textContent = `Blad logowania: ${error.message}`;
  }
}

async function ensureHouseholdAfterLogin() {
  if (householdId) return;
  const inviteCode = normalizeInviteCode(elements.householdCodeInput.value);
  if (!inviteCode) return;
  await joinOrCreateHousehold(inviteCode);
}

async function joinOrCreateHousehold(inviteCode) {
  let result = await supabaseClient.rpc("join_household", { household_invite_code: inviteCode });

  if (result.error) {
    result = await supabaseClient.rpc("create_household", {
      household_name: "Dom",
      household_invite_code: inviteCode,
    });
  }

  if (result.error) throw result.error;
  householdId = result.data;
  localStorage.setItem(HOUSEHOLD_KEY, householdId);
}

function showAuth() {
  elements.fridgeView.hidden = true;
  elements.authView.hidden = false;
  elements.pinInput.value = "";
  if (useCloud) {
    elements.emailInput.focus();
  } else {
    elements.pinInput.focus();
  }
}

function showFridge() {
  elements.authView.hidden = true;
  elements.fridgeView.hidden = false;
  render();
  maybeShowExpiryNotification();
}

async function lockApp() {
  if (useCloud) {
    await supabaseClient.auth.signOut();
    householdId = "";
    localStorage.removeItem(HOUSEHOLD_KEY);
    showAuth();
    return;
  }

  sessionStorage.removeItem(SESSION_KEY);
  showAuth();
}

function handleCategoryTabClick(event) {
  const group = event.currentTarget.dataset.categoryGroup;
  if (activeCategoryGroups.has(group)) {
    activeCategoryGroups.delete(group);
  } else {
    activeCategoryGroups.add(group);
  }

  activeSubcategories = new Set(
    [...activeSubcategories].filter((category) => getSelectedGroupCategories().includes(category)),
  );
  syncCategoryTabs();
  renderSubcategoryFilters();
  render();
}

function handleSubcategoryClick(event) {
  const category = event.currentTarget.dataset.subcategory;
  if (activeSubcategories.has(category)) {
    activeSubcategories.delete(category);
  } else {
    activeSubcategories.add(category);
  }

  renderSubcategoryFilters();
  render();
}

function syncCategoryTabs() {
  elements.categoryTabs.forEach((tab) => {
    const isActive = activeCategoryGroups.has(tab.dataset.categoryGroup);
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
}

async function handleFoodSubmit(event) {
  event.preventDefault();
  const id = elements.foodId.value || crypto.randomUUID();
  const noExpiration = elements.noExpirationInput.checked;
  const isFrozen = elements.frozenInput.checked;
  const payload = {
    id,
    name: elements.nameInput.value.trim(),
    price: Number(elements.priceInput.value),
    purchaseDate: elements.purchaseDateInput.value,
    expirationDate: noExpiration ? null : elements.expirationDateInput.value,
    amount: Number(elements.weightInput.value),
    unit: elements.unitInput.value,
    category: elements.categoryInput.value,
    notes: elements.notesInput.value.trim(),
    isFrozen,
    frozenDate: isFrozen ? elements.frozenDateInput.value : "",
    createdAt: items.find((item) => item.id === id)?.createdAt || new Date().toISOString(),
  };

  if (!noExpiration && new Date(payload.expirationDate) < new Date(payload.purchaseDate)) {
    elements.expirationDateInput.setCustomValidity("Termin nie moze byc przed data zakupu.");
    elements.expirationDateInput.reportValidity();
    return;
  }

  if (isFrozen && new Date(payload.frozenDate) < new Date(payload.purchaseDate)) {
    elements.frozenDateInput.setCustomValidity("Data zamrozenia nie moze byc przed data zakupu.");
    elements.frozenDateInput.reportValidity();
    return;
  }

  elements.expirationDateInput.setCustomValidity("");
  elements.frozenDateInput.setCustomValidity("");
  if (useCloud) {
    await saveCloudFoodItem(payload);
    await loadCloudData();
  } else {
    items = items.some((item) => item.id === id)
      ? items.map((item) => (item.id === id ? payload : item))
      : [payload, ...items];
    saveItems();
  }

  resetForm();
  render();
  renderShopping();
}

function resetForm() {
  elements.foodForm.reset();
  elements.foodId.value = "";
  elements.formTitle.textContent = "Dodaj produkt";
  elements.cancelEditButton.hidden = true;
  elements.purchaseDateInput.value = toInputDate(new Date());
  elements.expirationDateInput.value = offsetDate(7);
  elements.frozenDateInput.value = toInputDate(new Date());
  elements.noExpirationInput.checked = false;
  elements.frozenInput.checked = false;
  elements.unitInput.value = "g/ml";
  syncExpirationField();
  syncFrozenField();
  elements.categoryInput.value = "Nabial";
}

function editItem(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  elements.foodId.value = item.id;
  elements.nameInput.value = item.name;
  elements.priceInput.value = item.price;
  elements.weightInput.value = item.amount;
  elements.unitInput.value = item.unit;
  elements.purchaseDateInput.value = item.purchaseDate;
  elements.noExpirationInput.checked = !item.expirationDate;
  elements.expirationDateInput.value = item.expirationDate || offsetDate(7);
  elements.frozenInput.checked = item.isFrozen;
  elements.frozenDateInput.value = item.frozenDate || toInputDate(new Date());
  syncExpirationField();
  syncFrozenField();
  elements.categoryInput.value = item.category;
  elements.notesInput.value = item.notes;
  elements.formTitle.textContent = "Edytuj produkt";
  elements.cancelEditButton.hidden = false;
  elements.nameInput.focus();
}

async function deleteItem(id) {
  if (useCloud) {
    const { error } = await supabaseClient.from("food_items").delete().eq("id", id).eq("household_id", householdId);
    if (error) {
      alert(`Nie udalo sie usunac produktu: ${error.message}`);
      return;
    }
    await loadCloudData();
  } else {
    items = items.filter((item) => item.id !== id);
    saveItems();
  }

  render();
  renderShopping();
}

function render() {
  const enriched = getEnrichedItems();
  const filtered = filterItems(enriched);

  renderStats(filtered);
  renderAlerts(filtered);
  renderList(filtered);
}

function getEnrichedItems() {
  return items
    .map((item) => ({
      ...item,
      categoryGroup: getCategoryGroup(item.category),
      status: getStatus(item),
      daysLeft: getDaysLeft(item.expirationDate),
    }))
    .sort((a, b) => getSortDate(a.expirationDate) - getSortDate(b.expirationDate));
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
    alert.role = "button";
    alert.tabIndex = 0;
    alert.textContent = item.status === "expired"
      ? `${item.name}: termin minal ${Math.abs(item.daysLeft)} dni temu.`
      : `${item.name}: zostalo ${item.daysLeft} dni.`;
    alert.addEventListener("click", () => focusItemFromAlert(item));
    alert.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        focusItemFromAlert(item);
      }
    });
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

  groupItemsByName(source).forEach((group) => {
    if (group.items.length === 1) {
      elements.foodList.append(createFoodNode(group.items[0]));
      return;
    }

    const details = document.createElement("details");
    details.className = "food-group";
    details.open = true;

    const summary = document.createElement("summary");
    summary.innerHTML = `<strong>${group.name}</strong><span>${group.items.length} wpisy - ${formatCurrency(group.totalValue)}</span>`;
    details.append(summary);

    const list = document.createElement("div");
    list.className = "food-group-list";
    group.items.forEach((item) => list.append(createFoodNode(item)));
    details.append(list);
    elements.foodList.append(details);
  });
}

function createFoodNode(item) {
  const node = elements.template.content.firstElementChild.cloneNode(true);
  node.id = `item-${item.id}`;
  node.classList.add(item.status);
  node.querySelector("h3").textContent = item.name;
  node.querySelector(".food-meta").textContent = `${CATEGORY_GROUP_LABELS[item.categoryGroup]} - ${item.category} - ${formatAmount(item)} - ${formatCurrency(item.price)}`;
  node.querySelector(".food-details").textContent = getStatusText(item);
  node.querySelector(".edit").addEventListener("click", () => editItem(item.id));
  node.querySelector(".shop").addEventListener("click", () => addShoppingItem(item.name, item.amount, item.unit));
  node.querySelector(".delete").addEventListener("click", () => deleteItem(item.id));
  return node;
}

function focusItemFromAlert(item) {
  activeCategoryGroups = new Set([item.categoryGroup]);
  activeSubcategories = new Set([item.category]);
  syncCategoryTabs();
  renderSubcategoryFilters();
  render();

  requestAnimationFrame(() => {
    const target = document.querySelector(`#item-${CSS.escape(item.id)}`);
    if (!target) return;

    const group = target.closest(".food-group");
    if (group) group.open = true;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("highlight");
    setTimeout(() => target.classList.remove("highlight"), 1400);
  });
}

function groupItemsByName(source) {
  const groups = new Map();
  source.forEach((item) => {
    const key = item.name.trim().toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { name: item.name, items: [], totalValue: 0 });
    }
    const group = groups.get(key);
    group.items.push(item);
    group.totalValue += item.price;
  });
  return [...groups.values()];
}

function filterItems(source) {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filter = elements.filterInput.value;

  return source.filter((item) => {
    const matchesQuery = [item.name, item.category, item.notes].some((field) => field.toLowerCase().includes(query));
    const matchesFilter = filter === "all" || item.status === filter;
    const matchesCategoryGroup = activeCategoryGroups.size === 0 || activeCategoryGroups.has(item.categoryGroup);
    const matchesSubcategory = activeSubcategories.size === 0 || activeSubcategories.has(item.category);
    return matchesQuery && matchesFilter && matchesCategoryGroup && matchesSubcategory;
  });
}

function getCategoryGroup(category) {
  const group = Object.entries(CATEGORY_GROUPS).find(([, categories]) => categories.includes(category));
  return group ? group[0] : "utility";
}

function renderSubcategoryFilters() {
  const categories = getSelectedGroupCategories();
  elements.subcategoryFilters.replaceChildren();

  if (!categories.length) {
    const empty = document.createElement("p");
    empty.className = "muted subcategory-empty";
    empty.textContent = "Wybierz dzial u gory, zeby pokazac podkategorie.";
    elements.subcategoryFilters.append(empty);
    return;
  }

  categories.forEach((category) => {
    const button = document.createElement("button");
    const isActive = activeSubcategories.has(category);
    button.className = "subcategory-toggle";
    button.classList.toggle("active", isActive);
    button.type = "button";
    button.dataset.subcategory = category;
    button.setAttribute("aria-pressed", String(isActive));
    button.textContent = category;
    button.addEventListener("click", handleSubcategoryClick);
    elements.subcategoryFilters.append(button);
  });
}

function getSelectedGroupCategories() {
  const groups = activeCategoryGroups.size ? [...activeCategoryGroups] : Object.keys(CATEGORY_GROUPS);
  return groups.flatMap((group) => CATEGORY_GROUPS[group] || []);
}

function getStatus(item) {
  if (item.isFrozen) return "frozen";
  if (!item.expirationDate) return "no-expiry";
  const daysLeft = getDaysLeft(item.expirationDate);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= SOON_DAYS) return "soon";
  return "fresh";
}

function getStatusText(item) {
  if (item.status === "frozen") return `Zamrozone ${formatDate(item.frozenDate)} - kupione ${formatDate(item.purchaseDate)}`;
  if (item.status === "no-expiry") return `Bez terminu - kupione ${formatDate(item.purchaseDate)}`;
  if (item.status === "expired") return `Po terminie od ${Math.abs(item.daysLeft)} dni - kupione ${formatDate(item.purchaseDate)}`;
  if (item.daysLeft === 0) return `Termin mija dzisiaj - kupione ${formatDate(item.purchaseDate)}`;
  if (item.status === "soon") return `Zostalo ${item.daysLeft} dni - kupione ${formatDate(item.purchaseDate)}`;
  return `Wazne do ${formatDate(item.expirationDate)} - kupione ${formatDate(item.purchaseDate)}`;
}

function syncExpirationField() {
  const disabled = elements.noExpirationInput.checked;
  elements.expirationDateInput.disabled = disabled;
  elements.expirationDateInput.required = !disabled;
  elements.expirationDateInput.setCustomValidity("");
}

function syncFrozenField() {
  const enabled = elements.frozenInput.checked;
  elements.frozenDateInput.disabled = !enabled;
  elements.frozenDateInput.required = enabled;
  if (enabled && !elements.frozenDateInput.value) {
    elements.frozenDateInput.value = toInputDate(new Date());
  }
  elements.frozenDateInput.setCustomValidity("");
}

function toggleShoppingPanel() {
  elements.shoppingPanel.hidden = !elements.shoppingPanel.hidden;
  elements.shoppingToggleButton.classList.toggle("active", !elements.shoppingPanel.hidden);
}

async function handleShoppingSubmit(event) {
  event.preventDefault();
  await addShoppingItem(
    elements.shoppingNameInput.value.trim(),
    Number(elements.shoppingAmountInput.value) || null,
    elements.shoppingUnitInput.value,
  );
  elements.shoppingForm.reset();
}

async function seedShoppingFromProducts() {
  const existing = new Set(shoppingItems.map((item) => item.name.toLowerCase()));
  const newItems = [];
  getUniqueArticles().forEach((name) => {
    if (!existing.has(name.toLowerCase())) {
      newItems.push({ id: crypto.randomUUID(), name, amount: null, unit: "" });
    }
  });

  if (useCloud && newItems.length) {
    const { error } = await supabaseClient.from("shopping_items").insert(newItems.map(toDbShoppingItem));
    if (error) {
      alert(`Nie udalo sie utworzyc listy zakupow: ${error.message}`);
      return;
    }
    await loadCloudData();
  } else {
    shoppingItems.push(...newItems);
    saveShoppingItems();
  }

  renderShopping();
  elements.shoppingPanel.hidden = false;
  elements.shoppingToggleButton.classList.add("active");
}

async function addShoppingItem(name, amount = null, unit = "") {
  if (!name) return;
  const item = { id: crypto.randomUUID(), name, amount, unit };

  if (useCloud) {
    const { error } = await supabaseClient.from("shopping_items").insert(toDbShoppingItem(item));
    if (error) {
      alert(`Nie udalo sie dodac do listy zakupow: ${error.message}`);
      return;
    }
    await loadCloudData();
  } else {
    shoppingItems = [item, ...shoppingItems];
    saveShoppingItems();
  }

  renderShopping();
  elements.shoppingPanel.hidden = false;
  elements.shoppingToggleButton.classList.add("active");
}

async function deleteShoppingItem(id) {
  if (useCloud) {
    const { error } = await supabaseClient.from("shopping_items").delete().eq("id", id).eq("household_id", householdId);
    if (error) {
      alert(`Nie udalo sie usunac z listy: ${error.message}`);
      return;
    }
    await loadCloudData();
  } else {
    shoppingItems = shoppingItems.filter((item) => item.id !== id);
    saveShoppingItems();
  }

  renderShopping();
}

function renderShopping() {
  renderShoppingSuggestions();
  updateShoppingExportOutput();
  elements.shoppingList.replaceChildren();

  if (!shoppingItems.length) {
    const empty = document.createElement("div");
    empty.className = "shopping-empty";
    empty.textContent = "Lista zakupow jest pusta.";
    elements.shoppingList.append(empty);
    return;
  }

  shoppingItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "shopping-item";
    const quantity = item.amount && item.unit ? ` - ${item.amount} ${item.unit}` : "";
    row.innerHTML = `<span>${item.name}${quantity}</span>`;

    const button = document.createElement("button");
    button.className = "icon-button delete";
    button.type = "button";
    button.title = "Usun z listy";
    button.setAttribute("aria-label", "Usun z listy");
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>';
    button.addEventListener("click", () => deleteShoppingItem(item.id));
    row.append(button);
    elements.shoppingList.append(row);
  });
}

async function exportShoppingList() {
  const text = getShoppingExportText();
  elements.shoppingExportOutput.hidden = false;
  elements.shoppingExportOutput.value = text;
  elements.shoppingExportOutput.focus();
  elements.shoppingExportOutput.select();

  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    elements.shoppingExportOutput.value = `${text}\n\nSkopiowano do schowka.`;
  } catch {
    document.execCommand("copy");
  }
}

function updateShoppingExportOutput() {
  if (!elements.shoppingExportOutput.hidden) {
    elements.shoppingExportOutput.value = getShoppingExportText();
  }
}

function getShoppingExportText() {
  if (!shoppingItems.length) return "";
  return shoppingItems
    .map((item) => {
      const quantity = item.amount && item.unit ? ` - ${item.amount} ${item.unit}` : "";
      return `- ${item.name}${quantity}`;
    })
    .join("\n");
}

function renderShoppingSuggestions() {
  elements.articleSuggestions.replaceChildren();
  getUniqueArticles().forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    elements.articleSuggestions.append(option);
  });
}

function getUniqueArticles() {
  return [...new Set(items.map((item) => item.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"));
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

function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  setTheme(savedTheme === "dark" ? "dark" : "light");
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  setTheme(nextTheme);
}

function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  elements.themeToggleButton.setAttribute("aria-pressed", String(isDark));
  elements.themeToggleButton.setAttribute("title", isDark ? "Tryb jasny" : "Tryb ciemny");
  elements.themeToggleButton.setAttribute("aria-label", isDark ? "Tryb jasny" : "Tryb ciemny");
}

async function loadCloudData() {
  if (!householdId) return;

  const [foodResult, shoppingResult] = await Promise.all([
    supabaseClient.from("food_items").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
    supabaseClient.from("shopping_items").select("*").eq("household_id", householdId).order("created_at", { ascending: false }),
  ]);

  if (foodResult.error) throw foodResult.error;
  if (shoppingResult.error) throw shoppingResult.error;

  items = foodResult.data.map(fromDbFoodItem);
  shoppingItems = shoppingResult.data.map(fromDbShoppingItem);
}

async function saveCloudFoodItem(item) {
  const payload = toDbFoodItem(item);
  const { error } = await supabaseClient.from("food_items").upsert(payload);
  if (error) throw error;
}

async function migrateLocalDataToCloud() {
  if (!householdId || localStorage.getItem(`virtual-fridge-migrated-${householdId}`) === "true") return;

  const { data, error } = await supabaseClient
    .from("food_items")
    .select("id")
    .eq("household_id", householdId)
    .limit(1);

  if (error) throw error;
  if (data.length) {
    localStorage.setItem(`virtual-fridge-migrated-${householdId}`, "true");
    return;
  }

  const localItems = loadItems();
  const localShopping = loadShoppingItems();

  if (localItems.length) {
    const { error: foodError } = await supabaseClient.from("food_items").insert(localItems.map(toDbFoodItem));
    if (foodError) throw foodError;
  }

  if (localShopping.length) {
    const { error: shoppingError } = await supabaseClient
      .from("shopping_items")
      .insert(localShopping.map(toDbShoppingItem));
    if (shoppingError) throw shoppingError;
  }

  localStorage.setItem(`virtual-fridge-migrated-${householdId}`, "true");
}

function toDbFoodItem(item) {
  return {
    id: item.id,
    household_id: householdId,
    name: item.name,
    price: item.price,
    purchase_date: item.purchaseDate,
    expiration_date: item.expirationDate || null,
    amount: item.amount,
    unit: item.unit,
    category: item.category,
    notes: item.notes || "",
    is_frozen: item.isFrozen,
    frozen_date: item.isFrozen ? item.frozenDate : null,
    created_at: item.createdAt,
  };
}

function fromDbFoodItem(row) {
  return normalizeItem({
    id: row.id,
    name: row.name,
    price: Number(row.price),
    purchaseDate: row.purchase_date,
    expirationDate: row.expiration_date,
    amount: Number(row.amount),
    unit: row.unit,
    category: row.category,
    notes: row.notes || "",
    isFrozen: row.is_frozen,
    frozenDate: row.frozen_date || "",
    createdAt: row.created_at,
  });
}

function toDbShoppingItem(item) {
  return {
    id: item.id,
    household_id: householdId,
    name: item.name,
    amount: item.amount,
    unit: item.unit || "",
  };
}

function fromDbShoppingItem(row) {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount === null ? null : Number(row.amount),
    unit: row.unit || "",
  };
}

function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialItems.map(normalizeItem);

  try {
    const parsed = JSON.parse(saved).map(normalizeItem);
    return parsed.length < 6 ? mergeSeedItems(parsed) : parsed;
  } catch {
    return initialItems.map(normalizeItem);
  }
}

function loadShoppingItems() {
  const saved = localStorage.getItem(SHOPPING_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function saveShoppingItems() {
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingItems));
}

function normalizeItem(item) {
  const amount = Number(item.amount ?? item.weight ?? 1);
  const isFrozen = Boolean(item.isFrozen);
  return {
    ...item,
    amount,
    unit: item.unit || "g/ml",
    isFrozen,
    frozenDate: isFrozen ? item.frozenDate || item.purchaseDate : "",
  };
}

function mergeSeedItems(existingItems) {
  const existingKeys = new Set(existingItems.map((item) => `${item.name.toLowerCase()}-${item.category}`));
  const extras = initialItems
    .map(normalizeItem)
    .filter((item) => !existingKeys.has(`${item.name.toLowerCase()}-${item.category}`));
  return [...existingItems, ...extras];
}

function createSeedItem(name, price, purchaseOffset, expiryOffset, amount, unit, category, notes, isFrozen = false, frozenOffset = null) {
  return {
    id: crypto.randomUUID(),
    name,
    price,
    purchaseDate: offsetDate(purchaseOffset),
    expirationDate: expiryOffset === null ? null : offsetDate(expiryOffset),
    amount,
    unit,
    category,
    notes,
    isFrozen,
    frozenDate: isFrozen ? offsetDate(frozenOffset ?? purchaseOffset) : "",
    createdAt: new Date().toISOString(),
  };
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

function formatAmount(item) {
  return `${item.amount} ${item.unit}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

function formatDate(dateValue) {
  if (!dateValue) return "brak daty";
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateValue));
}

function normalizeInviteCode(value) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
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
