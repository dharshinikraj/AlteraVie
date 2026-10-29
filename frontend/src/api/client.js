const configuredApiBase = (import.meta.env.VITE_API_BASE || "").trim();
const API_BASE = configuredApiBase || (import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : "");

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("nutriassess_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If the request body is FormData, let the browser define the multipart boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  } catch (err) {
    const target = API_BASE || window.location.origin;
    const reason = err instanceof Error && err.message ? ` ${err.message}` : "";
    throw new Error(`Cannot reach the AlteraVie API at ${target}.${reason}`);
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      } else {
        detail = JSON.stringify(body);
      }
    } catch {
      /* response wasn't JSON */
    }
    throw new Error(`API request failed (HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}): ${detail}`);
  }

  return res.json();
}

export const api = {
  createUser: (payload) =>
    request("/user", { method: "POST", body: JSON.stringify(payload) }),

  predict: (payload) =>
    request("/predict", { method: "POST", body: JSON.stringify(payload) }),

  nutrition: (payload) =>
    request("/nutrition", { method: "POST", body: JSON.stringify(payload) }),

  recommend: (payload) =>
    request("/recommend", { method: "POST", body: JSON.stringify(payload) }),

  // Auth endpoints
  register: (payload) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  logout: () =>
    request("/auth/logout", { method: "POST" }),

  getMe: () =>
    request("/auth/me"),

  // History & Dashboard
  getAssessmentsHistory: () =>
    request("/user/history"),

  // Blood reports endpoints
  extractBloodReport: (formData) =>
    request("/blood-report/extract", { method: "POST", body: formData }),

  uploadBloodReport: (formData) =>
    request("/blood-report/upload", { method: "POST", body: formData }),

  recordManualReport: (payload) =>
    request("/blood-report/manual", { method: "POST", body: JSON.stringify(payload) }),

  getBloodReportsHistory: () =>
    request("/blood-report/history"),

  // Food Vision — Module 8
  getFoodVisionDishes: () =>
    request("/food-vision/dishes"),

  predictFoodVision: (formData, portionMultiplier = 1.0) =>
    request(`/food-vision/predict?portion_multiplier=${portionMultiplier}`, {
      method: "POST",
      body: formData,
    }),

  logFoodMeal: (payload) =>
    request("/food-vision/log", { method: "POST", body: JSON.stringify(payload) }),

  getTodayFoodLogs: () =>
    request("/food-vision/log/today"),

  getTodayNutritionSummary: () =>
    request("/food-vision/log/summary/today"),

  deleteFoodLog: (id) =>
    request(`/food-vision/log/${id}`, { method: "DELETE" }),

  // Specialist Finder — Module 7
  searchSpecialists: (lat, lng) =>
    request(`/specialists/search?lat=${lat}&lng=${lng}`),

  searchSpecialistsByPlace: (query) =>
    request(`/specialists/search-place?q=${encodeURIComponent(query)}`),

  getDoctorPlaces: (city = null) =>
    request(`/specialists/places${city ? `?city=${encodeURIComponent(city)}` : ""}`),

  // RAG Chatbot Companion — Module 9
  chat: (payload) =>
    request("/chat", { method: "POST", body: JSON.stringify(payload) }),

  getChatSuggestions: () =>
    request("/chat/suggestions"),

  searchLiveFoods: (q) =>
    request(`/live-data/foods/search?q=${encodeURIComponent(q)}`),

  // Pantry Chef — Module 11
  pantrySuggest: (payload) =>
    request("/pantry/suggest", { method: "POST", body: JSON.stringify(payload) }),

  getLiveFoodRecommendations: (nutrient = "iron", diet = "vegetarian") =>
    request(`/live-data/foods/recommendations?nutrient=${encodeURIComponent(nutrient)}&diet=${encodeURIComponent(diet)}`),
};
