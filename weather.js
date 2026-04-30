const DEFAULT_LOCATION = {
  latitude: 46.62145881971474,
  longitude: 29.904836571587,
  city: "Днестровск",
};

const STORAGE_KEY = "weather_app_saved_location";

const weatherCodesDay = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌦️",
  63: "🌧️",
  65: "⛈️",
  71: "🌨️",
  73: "❄️",
  75: "❄️",
  77: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

const weatherCodesNight = {
  0: "🌙",
  1: "🌙",
  2: "🌙",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌙🌧️",
  53: "🌙🌧️",
  55: "🌧️",
  61: "🌙🌧️",
  63: "🌧️",
  65: "🌩️",
  71: "🌙🌨️",
  73: "🌨️",
  75: "❄️",
  77: "❄️",
  80: "🌙🌧️",
  81: "🌧️",
  82: "🌩️",
  85: "🌙🌨️",
  86: "❄️",
  95: "🌩️",
  96: "🌩️",
  99: "🌩️",
};

function getWeatherEmoji(code, isDay = true) {
  const weatherMap = isDay ? weatherCodesDay : weatherCodesNight;
  return weatherMap[code] || (isDay ? "🌤️" : "🌙");
}

function getWeatherIcon(code, isDay = true) {
  return getWeatherEmoji(code, isDay);
}

function setWeatherIcon(element, code, isDay = true) {
  if (!element) return;
  element.textContent = getWeatherEmoji(code, isDay);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return days[date.getDay()];
}

function formatDayDate(dateString) {
  const date = new Date(dateString);
  const months = ["янв.", "фев.", "мар.", "апр.", "май", "июн.", "июл.", "авг.", "сен.", "окт.", "ноя.", "дек."];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function formatTime(timeString) {
  const date = new Date(timeString);
  return date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
}

function formatSunTime(isoString) {
  const date = new Date(isoString);
  return `${date.getHours()}:${date.getMinutes() < 10 ? "0" : ""}${date.getMinutes()}`;
}

function formatValue(value, suffix = "") {
  if (value === undefined || value === null || Number.isNaN(value)) return "--";
  return Math.round(value) + suffix;
}

function getWindDirectionLabel(speed, degrees) {
  if (speed === undefined || speed === null || Number.isNaN(speed) || degrees === undefined || degrees === null || Number.isNaN(degrees)) {
    return "--";
  }
  const directions = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % directions.length;
  return `${Math.round(speed)} м/с ${directions[index]}`;
}

function getWindCategory(speed) {
  if (!speed || Number.isNaN(speed)) return { icon: "🍃", label: "Штиль", desc: "Ветер почти не ощущается" };
  if (speed < 1) return { icon: "🍃", label: "Штиль", desc: "Ветер почти не ощущается" };
  if (speed < 5) return { icon: "🍃", label: "Тихий", desc: "Лёгкий приятный ветерок" };
  if (speed < 10) return { icon: "🌬️", label: "Умеренный", desc: "Качаются листья и ветки" };
  if (speed < 20) return { icon: "💨", label: "Сильный", desc: "Качаются деревья, сложно идти" };
  if (speed < 30) return { icon: "🌪️", label: "Очень сильный", desc: "Возможны повреждения" };
  return { icon: "⛈️", label: "Шторм", desc: "Опасно выходить наружу!" };
}

function getWeatherTip(weatherCode, uv, temp, wind) {
  if (uv >= 8) return "☀️ Очень высокий UV! Избегайте солнца с 10 до 16 часов";
  if (uv >= 5) return "🧴 Высокий UV — используйте солнцезащитный крем";
  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) return "☂️ Возьмите зонт — ожидается дождь";
  if ([71, 73, 75, 85, 86].includes(weatherCode)) return "❄️ Снегопад! Одевайтесь теплее";
  if (weatherCode === 95) return "⛈️ Гроза — оставайтесь дома";
  if (temp < -10) return "🧣 Очень холодно! Наденьте тёплую одежду";
  if (temp < 0) return "🧥 Температура ниже нуля, не забудьте шапку";
  if (temp > 30) return "💧 Очень жарко, пейте больше воды";
  if (wind >= 20) return "💨 Сильный ветер, будьте осторожны";
  if (weatherCode === 45) return "🌫️ Туман — будьте внимательны на дороге";
  if (weatherCode === 0) return "☀️ Отличная погода для прогулки!";
  return "🌤️ Хороший день — наслаждайтесь погодой";
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

async function detectUserLocation() {
  try {
    const position = await getCurrentPosition();
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=ru&zoom=10`,
    );
    const data = await response.json();
    const city = data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(",")[0] || DEFAULT_LOCATION.city;
    return { latitude: position.coords.latitude, longitude: position.coords.longitude, city };
  } catch (error) {
    console.warn("Геолокация не доступна:", error.message);
    return DEFAULT_LOCATION;
  }
}

async function searchCity(query) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ru&limit=5`);
    const data = await response.json();
    return data.map((item) => ({
      name: item.display_name.split(",").slice(0, 2).join(","),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error("Ошибка поиска города:", error);
    return [];
  }
}

function setTextContent(selector, value) {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
}

function applyTheme(isDay) {
  document.body.classList.toggle("night-theme", !isDay);
  document.documentElement.classList.toggle("night-theme", !isDay);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", isDay ? "#55cfff" : "#0f1c3d");
}

function applyWeatherEffects(weatherCode) {
  document.body.classList.remove("rain", "snow");
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
    document.body.classList.add("rain");
    createRainEffect();
  } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    document.body.classList.add("snow");
    createSnowEffect();
  }
}

function createRainEffect() {
  const container = document.querySelector(".rain-container");
  if (!container || container.children.length > 0) return;
  for (let i = 0; i < 60; i++) {
    const drop = document.createElement("div");
    drop.className = "rain-drop";
    drop.style.left = Math.random() * 100 + "%";
    drop.style.height = (15 + Math.random() * 25) + "px";
    drop.style.animationDuration = (0.4 + Math.random() * 0.4) + "s";
    drop.style.animationDelay = Math.random() * 2 + "s";
    drop.style.opacity = 0.3 + Math.random() * 0.5;
    container.appendChild(drop);
  }
}

function createSnowEffect() {
  const container = document.querySelector(".snow-container");
  if (!container || container.children.length > 0) return;
  for (let i = 0; i < 40; i++) {
    const flake = document.createElement("div");
    flake.className = "snow-flake";
    flake.style.left = Math.random() * 100 + "%";
    flake.style.width = flake.style.height = (4 + Math.random() * 6) + "px";
    flake.style.animationDuration = (3 + Math.random() * 5) + "s";
    flake.style.animationDelay = Math.random() * 5 + "s";
    flake.style.opacity = 0.5 + Math.random() * 0.5;
    container.appendChild(flake);
  }
}

function renderTemperatureChart(hourly) {
  const chartLine = document.querySelector(".chart-line");
  const chartArea = document.querySelector(".chart-area");
  if (!chartLine || !chartArea) return;

  const nowIndex = new Date().getHours();
  const temps = [];
  const labels = [];
  for (let i = 0; i < 24; i++) {
    const idx = nowIndex + i;
    if (idx >= hourly.time.length) break;
    labels.push(idx % 24);
    temps.push(hourly.temperature_2m[idx]);
  }

  if (temps.length < 2) return;

  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;
  const w = 400;
  const h = 80;
  const pad = 10;

  const chartMinEl = document.querySelector("[data-chart-min]");
  const chartMaxEl = document.querySelector("[data-chart-max]");
  if (chartMinEl) chartMinEl.textContent = Math.round(min) + "°";
  if (chartMaxEl) chartMaxEl.textContent = Math.round(max) + "°";

  const points = temps.map((t, i) => ({
    x: pad + (i / (temps.length - 1)) * (w - pad * 2),
    y: h - pad - ((t - min) / range) * (h - pad * 2),
  }));

  let lineD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
    const cp1y = points[i - 1].y;
    const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
    const cp2y = points[i].y;
    lineD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
  }
  chartLine.setAttribute("d", lineD);

  let areaD = lineD + ` L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;
  chartArea.setAttribute("d", areaD);

  const dot = document.querySelector(".chart-dot");
  if (dot) {
    dot.setAttribute("cx", points[0].x);
    dot.setAttribute("cy", points[0].y);
  }
}

function renderHourlyForecast(hourly) {
  const hourlyCard = document.querySelector("#hourly-card");
  if (!hourlyCard) return;

  const nowIndex = new Date().getHours();
  const hoursToShow = 18;
  const items = [];

  for (let i = 0; i < hoursToShow; i++) {
    const idx = nowIndex + i;
    if (idx >= hourly.time.length) break;
    items.push(`<div class="hourly-item">
      <span class="hourly-time">${i === 0 ? "Сейчас" : formatTime(hourly.time[idx])}</span>
      <span class="hourly-icon">${getWeatherEmoji(hourly.weather_code[idx], hourly.is_day?.[idx] === 1)}</span>
      <span class="hourly-temp">${Math.round(hourly.temperature_2m[idx])}°</span>
    </div>`);
  }

  hourlyCard.innerHTML = items.join("");
  hourlyCard.scrollTo({ left: 0, behavior: "smooth" });
}

function renderDailyForecast(daily) {
  const dailyCard = document.querySelector("#daily-card");
  if (!dailyCard) return;

  const items = [];
  for (let i = 0; i < daily.time.length; i++) {
    const dayName = i === 0 ? "Сегодня" : formatDate(daily.time[i]);
    items.push(`<div class="daily-row">
      <div class="daily-main">
        <div class="daily-summary">
          <span class="daily-day">${dayName}</span>
          <span class="daily-date">${formatDayDate(daily.time[i])}</span>
          <span class="daily-temp">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</span>
        </div>
        <span class="daily-weather">${getWeatherEmoji(daily.weather_code[i], true)}</span>
      </div>
      <div class="daily-details">
        <div class="daily-humidity">
          <span class="daily-meta-label">Влажность</span>
          <img src="https://api.builder.io/api/v1/image/assets/TEMP/d3f02883715c1f6b3371aa464e7f53821d5ef580?width=30" alt="">
          <span class="daily-humidity-text">${formatValue(daily.relative_humidity_2m_mean?.[i], "%")}</span>
        </div>
        <div class="daily-wind">
          <span class="daily-meta-label">Ветер</span>
          <img src="https://api.builder.io/api/v1/image/assets/TEMP/f454077513371d43dc70a601a0582685321fd7c1?width=30" alt="">
          <span class="daily-wind-text">${formatValue(daily.wind_speed_10m_max?.[i], " км/ч")}</span>
        </div>
      </div>
    </div>`);
  }

  dailyCard.innerHTML = items.join("");
  dailyCard.scrollTo({ left: 0, behavior: "smooth" });
}

function initSlider(cardSelector, prevSelector, nextSelector, fallbackWidth = 86, cardsPerStep = 3) {
  const card = document.querySelector(cardSelector);
  const prevBtn = document.querySelector(prevSelector);
  const nextBtn = document.querySelector(nextSelector);
  if (!card || !prevBtn || !nextBtn) return;

  const scrollByCards = (dir) => {
    const firstItem = card.firstElementChild;
    const itemWidth = firstItem ? firstItem.getBoundingClientRect().width : fallbackWidth;
    card.scrollBy({ left: dir * itemWidth * cardsPerStep, behavior: "smooth" });
  };
  prevBtn.addEventListener("click", () => scrollByCards(-1));
  nextBtn.addEventListener("click", () => scrollByCards(1));
}

function animateIn() {
  document.body.classList.remove("loading");
  const container = document.querySelector(".container");
  if (container) {
    container.style.opacity = "0";
    container.style.transform = "translateY(12px)";
    requestAnimationFrame(() => {
      container.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      container.style.opacity = "1";
      container.style.transform = "translateY(0)";
    });
  }
}

function saveLocation(location) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(location)); } catch (e) { console.warn(e); }
}

function getSavedLocation() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}

async function fetchWeather(location) {
  try {
    document.body.classList.add("loading");

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,is_day,uv_index&hourly=temperature_2m,weather_code,is_day,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,relative_humidity_2m_mean,wind_speed_10m_max,sunrise,sunset&timezone=auto`,
    );
    const data = await response.json();

    if (data.current && data.daily && data.hourly) {
      const current = data.current;
      const daily = data.daily;
      const hourly = data.hourly;

      lastWeatherData = data;

      document.querySelector(".header-left h1").textContent = location.city;

      const isDay = current.is_day === 1;
      const icon = getWeatherIcon(current.weather_code, isDay);
      updateMobileHeader(location.city, current.temperature_2m, icon);
      updateFavTemp(location.city, current.temperature_2m, icon);

      const now = new Date();
      document.querySelector(".header-left p").textContent = now.toLocaleDateString("ru-RU", {
        weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });

      document.querySelector(".current-temp-text").textContent = Math.round(current.temperature_2m) + "°";
      applyTheme(isDay);
      setWeatherIcon(document.querySelector(".current-weather-icon"), current.weather_code, isDay);

      applyWeatherEffects(current.weather_code);

      setTextContent("[data-pressure]", formatValue(current.pressure_msl, " гПа"));
      setTextContent("[data-uv]", formatValue(current.uv_index));
      setTextContent("[data-wind-direction]", getWindDirectionLabel(current.wind_speed_10m, current.wind_direction_10m));
      setTextContent("[data-apparent-temp]", formatValue(current.apparent_temperature, "°"));
      setTextContent("[data-humidity]", formatValue(current.relative_humidity_2m, "%"));

      if (daily.sunrise?.[0]) setTextContent("[data-sunrise]", formatSunTime(daily.sunrise[0]));
      if (daily.sunset?.[0]) setTextContent("[data-sunset]", formatSunTime(daily.sunset[0]));

      const windCat = getWindCategory(current.wind_speed_10m);
      const windCatEl = document.querySelector("[data-wind-category]");
      if (windCatEl) {
        windCatEl.querySelector(".wind-cat-icon").textContent = windCat.icon;
        windCatEl.querySelector(".wind-cat-text").textContent = `${windCat.label} — ${windCat.desc}`;
      }

      const tipEl = document.querySelector("[data-tip]");
      if (tipEl) {
        const tip = getWeatherTip(current.weather_code, current.uv_index, current.temperature_2m, current.wind_speed_10m);
        tipEl.querySelector(".tip-text").textContent = tip;
      }

      const pressurePct = Math.min(Math.max(((current.pressure_msl - 950) / 100) * 100, 0), 100);
      const pFill = document.querySelector("[data-pressure-fill]");
      if (pFill) pFill.style.strokeDashoffset = 119.3 - (pressurePct / 100) * 119.3;

      const uvPct = Math.min((current.uv_index / 11) * 100, 100);
      const uvFill = document.querySelector("[data-uv-fill]");
      if (uvFill) uvFill.style.strokeDashoffset = 119.3 - (uvPct / 100) * 119.3;

      const windPct = Math.min((current.wind_speed_10m / 30) * 100, 100);
      const wFill = document.querySelector("[data-wind-fill]");
      if (wFill) wFill.style.strokeDashoffset = 119.3 - (windPct / 100) * 119.3;

      setTextContent(".temp-high", Math.round(daily.temperature_2m_max[0]) + "°");
      setTextContent(".temp-low", Math.round(daily.temperature_2m_min[0]) + "°");

      renderHourlyForecast(hourly);
      renderDailyForecast(daily);
      renderTemperatureChart(hourly);

      animateIn();
    }
  } catch (error) {
    console.error("❌ Ошибка:", error);
    document.body.classList.remove("loading");
  }
}

function setupSearch() {
  const searchInput = document.querySelector(".search-input");
  const searchBtn = document.querySelector(".search-btn");
  const resultsBox = document.querySelector(".search-results");
  const geoBtn = document.querySelector(".btn-geo");
  const refreshBtn = document.querySelector(".btn-refresh");
  let searchTimeout;

  if (searchInput && resultsBox) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      const query = searchInput.value.trim();
      if (query.length < 2) { resultsBox.hidden = true; return; }

      searchTimeout = setTimeout(async () => {
        const results = await searchCity(query);
        if (results.length > 0) {
          resultsBox.innerHTML = results.map((r) =>
            `<div class="search-result-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}">${r.name}</div>`
          ).join("");
          resultsBox.hidden = false;
          resultsBox.querySelectorAll(".search-result-item").forEach((item) => {
            item.addEventListener("click", () => {
              const loc = { latitude: parseFloat(item.dataset.lat), longitude: parseFloat(item.dataset.lon), city: item.dataset.name.split(",").shift() };
              saveLocation(loc);
              searchInput.value = "";
              resultsBox.hidden = true;
              fetchWeather(loc);
            });
          });
        } else { resultsBox.hidden = true; }
      }, 400);
    });

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        if (searchInput.value.trim().length >= 2) searchInput.dispatchEvent(new Event("input"));
      });
    }

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-box")) resultsBox.hidden = true;
    });
  }

  if (geoBtn) {
    geoBtn.addEventListener("click", async () => {
      const loc = await detectUserLocation();
      saveLocation(loc);
      fetchWeather(loc);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      const saved = getSavedLocation();
      fetchWeather(saved || DEFAULT_LOCATION);
    });
  }
}

initSlider("#hourly-card", ".hourly-nav-prev", ".hourly-nav-next", 86, 3);
initSlider("#daily-card", ".daily-nav-prev", ".daily-nav-next", 180, 1);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => console.log("✅ SW:", reg))
      .catch((err) => console.log("❌ SW:", err));
  });
}

window.addEventListener("load", () => {
  setupSearch();
  initMobileMenu();
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 21;
  document.body.classList.toggle("night-theme", isNight);
  document.documentElement.classList.toggle("night-theme", isNight);
  const saved = getSavedLocation();
  fetchWeather(saved || DEFAULT_LOCATION);
});

setInterval(() => {
  const saved = getSavedLocation();
  fetchWeather(saved || DEFAULT_LOCATION);
}, 10 * 60 * 1000);

/* Mobile burger menu */
let useFahrenheit = false;
let lastWeatherData = null;
let favCities = JSON.parse(localStorage.getItem("weather_favs") || "[]");

function initMobileMenu() {
  const header = document.getElementById("mobile-header");
  const burgerBtn = document.getElementById("burger-btn");
  const overlay = document.getElementById("mobile-menu-overlay");
  const menuTime = document.getElementById("menu-time");
  const menuDate = document.getElementById("menu-date");
  const favList = document.getElementById("menu-fav-list");
  const addBtn = document.getElementById("menu-add-btn");
  const unitToggle = document.getElementById("unit-toggle");

  if (!header || !burgerBtn || !overlay) return;

  const unitKey = "weather_use_fahrenheit";
  useFahrenheit = localStorage.getItem(unitKey) === "true";
  unitToggle.checked = useFahrenheit;

  /* Scroll → show header */
  let lastScroll = 0;
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY || window.pageYOffset;
        if (y > 120) {
          header.classList.add("visible");
        } else {
          header.classList.remove("visible");
        }
        lastScroll = y;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* Burger open/close */
  function closeMenu() {
    burgerBtn.classList.remove("active");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  burgerBtn.addEventListener("click", () => {
    const isOpen = overlay.classList.contains("open");
    if (isOpen) {
      closeMenu();
    } else {
      burgerBtn.classList.add("active");
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      updateMenuTime();
      renderFavs();
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMenu();
  });

  /* Live clock */
  function updateMenuTime() {
    const now = new Date();
    menuTime.textContent = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    menuDate.textContent = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  }
  updateMenuTime();
  setInterval(updateMenuTime, 1000);

  /* Unit toggle */
  unitToggle.addEventListener("change", () => {
    useFahrenheit = unitToggle.checked;
    localStorage.setItem(unitKey, useFahrenheit);
    if (lastWeatherData) renderWeather(lastWeatherData);
    renderFavs();
  });

  /* Favorites */
  addBtn.addEventListener("click", () => {
    const saved = getSavedLocation();
    if (saved && saved.city) {
      const exists = favCities.find((f) => f.city === saved.city);
      if (!exists) {
        favCities.push({ city: saved.city, lat: saved.latitude, lon: saved.longitude, temp: null, icon: "☀️" });
        localStorage.setItem("weather_favs", JSON.stringify(favCities));
        renderFavs();
      }
    }
  });

  renderFavs();
}

function updateMobileHeader(city, tempC, icon) {
  const cityEl = document.getElementById("mobile-header-city");
  const tempEl = document.getElementById("mobile-header-temp");
  if (cityEl) cityEl.textContent = city || "—";
  if (tempEl) {
    const t = useFahrenheit ? Math.round(tempC * 9/5 + 32) : Math.round(tempC);
    const unit = useFahrenheit ? "°F" : "°";
    tempEl.textContent = icon + " " + t + unit;
  }
}

function renderFavs() {
  const favList = document.getElementById("menu-fav-list");
  const addBtn = document.getElementById("menu-add-btn");
  if (!favList) return;

  favList.innerHTML = "";

  if (favCities.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText = "padding:12px;text-align:center;color:rgba(255,255,255,0.4);font-size:13px;";
    empty.textContent = "Нажмите «+» чтобы добавить текущий город";
    favList.appendChild(empty);
  } else {
    favCities.forEach((fav, i) => {
      const el = document.createElement("div");
      el.className = "mobile-menu-fav-item";
      const unit = useFahrenheit ? "°F" : "°";
      const t = fav.temp !== null ? (useFahrenheit ? Math.round(fav.temp * 9/5 + 32) : Math.round(fav.temp)) : "--";
      el.innerHTML = `
        <span class="mobile-menu-fav-name">${fav.icon} ${fav.city}</span>
        <span class="mobile-menu-fav-temp">${t}${unit}</span>
        <button class="mobile-menu-fav-del" data-idx="${i}">✕</button>
      `;
      el.querySelector(".mobile-menu-fav-name").addEventListener("click", () => {
        const loc = { latitude: fav.lat, longitude: fav.lon, city: fav.city };
        saveLocation(loc);
        fetchWeather(loc);
        const overlay = document.getElementById("mobile-menu-overlay");
        const burgerBtn = document.getElementById("burger-btn");
        burgerBtn.classList.remove("active");
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      });
      el.querySelector(".mobile-menu-fav-del").addEventListener("click", (e) => {
        e.stopPropagation();
        favCities.splice(i, 1);
        localStorage.setItem("weather_favs", JSON.stringify(favCities));
        renderFavs();
      });
      favList.appendChild(el);
    });
  }

  if (addBtn) favList.appendChild(addBtn);
}

function updateFavTemp(city, tempC, icon) {
  const fav = favCities.find((f) => f.city === city);
  if (fav) {
    fav.temp = tempC;
    fav.icon = icon;
    localStorage.setItem("weather_favs", JSON.stringify(favCities));
    renderFavs();
  }
}

/* Mobile cloud swap */
function swapMobileCloud() {
  if (window.innerWidth < 768) {
    const cloud = document.querySelector(".cloud-top-right");
    if (cloud && cloud.src.includes("builder.io")) {
      cloud.src = "img/cold.png";
    }
  }
}
window.addEventListener("resize", swapMobileCloud);
window.addEventListener("load", swapMobileCloud);
