const DEFAULT_LOCATION = {
  latitude: 46.62145881971474,
  longitude: 29.904836571587,
  city: "Днестровск",
};

// Коды погоды Open-Meteo
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

function setWeatherIcon(element, code, isDay = true) {
  if (!element) return;
  element.textContent = getWeatherEmoji(code, isDay);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const day = days[date.getDay()];
  return day;
}

function formatDayDate(dateString) {
  const date = new Date(dateString);
  const months = [
    "янв.",
    "фев.",
    "мар.",
    "апр.",
    "май",
    "июн.",
    "июл.",
    "авг.",
    "сен.",
    "окт.",
    "ноя.",
    "дек.",
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function formatTime(timeString) {
  const date = new Date(timeString);
  return (
    date.getHours() +
    ":" +
    (date.getMinutes() < 10 ? "0" : "") +
    date.getMinutes()
  );
}

function formatValue(value, suffix = "") {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }
  return Math.round(value) + suffix;
}

function getWindDirectionLabel(speed, degrees) {
  if (
    speed === undefined ||
    speed === null ||
    Number.isNaN(speed) ||
    degrees === undefined ||
    degrees === null ||
    Number.isNaN(degrees)
  ) {
    return "--";
  }

  const directions = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % directions.length;
  return `${Math.round(speed)} м/с ${directions[index]}`;
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
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Используем Nominatim для reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru&zoom=10`,
    );
    const data = await response.json();

    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.display_name?.split(",")[0] ||
      DEFAULT_LOCATION.city;

    return {
      latitude,
      longitude,
      city,
    };
  } catch (error) {
    console.warn(
      "Геолокация не доступна, используем город по умолчанию:",
      error.message,
    );
    return DEFAULT_LOCATION;
  }
}

function setTextContent(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function applyTheme(isDay) {
  document.body.classList.toggle("night-theme", !isDay);
  document.documentElement.classList.toggle("night-theme", !isDay);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", isDay ? "#55cfff" : "#0f1c3d");
  }
}

function renderHourlyForecast(hourly) {
  const hourlyCard = document.querySelector("#hourly-card");
  if (!hourlyCard) return;

  const nowIndex = new Date().getHours();
  const hoursToShow = 18;
  const items = [];

  for (let i = 0; i < hoursToShow; i += 1) {
    const hourIndex = nowIndex + i;
    if (hourIndex >= hourly.time.length) break;

    const time = hourly.time[hourIndex];
    const temp = hourly.temperature_2m[hourIndex];
    const weatherCode = hourly.weather_code[hourIndex];
    const isDay = hourly.is_day?.[hourIndex] === 1;

    items.push(`
                    <div class="hourly-item">
                        <span class="hourly-time">${i === 0 ? "Сейчас" : formatTime(time)}</span>
                        <span class="hourly-icon" aria-label="Погода">${getWeatherEmoji(weatherCode, isDay)}</span>
                        <span class="hourly-temp">${Math.round(temp)}°</span>
                    </div>
                `);
  }

  hourlyCard.innerHTML = items.join("");
  hourlyCard.scrollTo({ left: 0, behavior: "smooth" });
}

function renderDailyForecast(daily) {
  const dailyCard = document.querySelector("#daily-card");
  if (!dailyCard) return;

  const items = [];

  for (let i = 0; i < daily.time.length; i += 1) {
    const date = daily.time[i];
    const tempMax = daily.temperature_2m_max[i];
    const tempMin = daily.temperature_2m_min[i];
    const weatherCode = daily.weather_code[i];
    const humidity = daily.relative_humidity_2m_mean?.[i];
    const windSpeed = daily.wind_speed_10m_max?.[i];
    const dayName = i === 0 ? "Сегодня" : formatDate(date);
    const dayDate = formatDayDate(date);

    items.push(`
                    <div class="daily-row">
                        <div class="daily-main">
                            <div class="daily-summary">
                                <span class="daily-day">${dayName}</span>
                                <span class="daily-date">${dayDate}</span>
                                <span class="daily-temp">${Math.round(tempMax)}° / ${Math.round(tempMin)}°</span>
                            </div>
                            <span class="daily-weather" aria-label="Погода">${getWeatherEmoji(weatherCode, true)}</span>
                        </div>
                        <div class="daily-details">
                            <div class="daily-humidity">
                                <span class="daily-meta-label">Влажность</span>
                                <img src="https://api.builder.io/api/v1/image/assets/TEMP/d3f02883715c1f6b3371aa464e7f53821d5ef580?width=30" alt="">
                                <span class="daily-humidity-text">${formatValue(humidity, "%")}</span>
                            </div>
                            <div class="daily-wind">
                                <span class="daily-meta-label">Ветер</span>
                                <img src="https://api.builder.io/api/v1/image/assets/TEMP/f454077513371d43dc70a601a0582685321fd7c1?width=30" alt="">
                                <span class="daily-wind-text">${formatValue(windSpeed, " км/ч")}</span>
                            </div>
                        </div>
                    </div>
                `);
  }

  dailyCard.innerHTML = items.join("");
  dailyCard.scrollTo({ left: 0, behavior: "smooth" });
}

function initSlider(
  cardSelector,
  prevSelector,
  nextSelector,
  fallbackWidth = 86,
  cardsPerStep = 3,
) {
  const card = document.querySelector(cardSelector);
  const prevButton = document.querySelector(prevSelector);
  const nextButton = document.querySelector(nextSelector);

  if (!card || !prevButton || !nextButton) return;

  const scrollByCards = (direction) => {
    const firstItem = card.firstElementChild;
    const itemWidth = firstItem
      ? firstItem.getBoundingClientRect().width
      : fallbackWidth;
    card.scrollBy({
      left: direction * itemWidth * cardsPerStep,
      behavior: "smooth",
    });
  };

  prevButton.addEventListener("click", () => scrollByCards(-1));
  nextButton.addEventListener("click", () => scrollByCards(1));
}

async function getWeather() {
  try {
    document.body.classList.add("loading");
    const location = await detectUserLocation();
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,is_day,uv_index&hourly=temperature_2m,weather_code,is_day,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,relative_humidity_2m_mean,wind_speed_10m_max&timezone=auto`,
    );
    const data = await response.json();

    if (data.current && data.daily && data.hourly) {
      const current = data.current;
      const daily = data.daily;
      const hourly = data.hourly;

      //  ЗАГОЛОВОК
      document.querySelector(".header-left h1").textContent = location.city;

      const now = new Date();
      const dateStr = now.toLocaleDateString("ru-RU", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      document.querySelector(".header-left p").textContent = dateStr;

      // ОСНОВНАЯ ТЕМПЕРАТУРА
      const currentTemp = Math.round(current.temperature_2m) + "°";
      document.querySelector(".current-temp-text").textContent = currentTemp;
      const isCurrentDay = current.is_day === 1;
      applyTheme(isCurrentDay);
      setWeatherIcon(
        document.querySelector(".current-weather-icon"),
        current.weather_code,
        isCurrentDay,
      );

      // ДОП. ПОКАЗАТЕЛИ
      setTextContent(
        "[data-pressure]",
        formatValue(current.pressure_msl, " гПа"),
      );
      setTextContent("[data-uv]", formatValue(current.uv_index));
      setTextContent(
        "[data-wind-direction]",
        getWindDirectionLabel(
          current.wind_speed_10m,
          current.wind_direction_10m,
        ),
      );

      // Шкалы
      const pressurePercent = Math.min(
        Math.max(((current.pressure_msl - 950) / (1050 - 950)) * 100, 0),
        100,
      );
      const pressureOffset = 125.6 - (pressurePercent / 100) * 125.6;
      const pressureFill = document.querySelector("[data-pressure-fill]");
      if (pressureFill) pressureFill.style.strokeDashoffset = pressureOffset;
      console.log("Pressure offset:", pressureOffset);

      const uvPercent = Math.min((current.uv_index / 12) * 100, 100);
      const uvOffset = 125.6 - (uvPercent / 100) * 125.6;
      const uvFill = document.querySelector("[data-uv-fill]");
      if (uvFill) uvFill.style.strokeDashoffset = uvOffset;
      console.log("UV offset:", uvOffset);

      const windSpeed = current.wind_speed_10m;
      const windPercent = Math.min((windSpeed / 30) * 100, 100);
      const windOffset = 125.6 - (windPercent / 100) * 125.6;
      const windFill = document.querySelector("[data-wind-fill]");
      if (windFill) windFill.style.strokeDashoffset = windOffset;
      console.log("Wind offset:", windOffset);
      setTextContent(
        "[data-humidity]",
        formatValue(current.relative_humidity_2m, "%"),
      );
      setTextContent(
        "[data-precipitation]",
        formatValue(hourly.precipitation_probability?.[0], "%"),
      );

      // МАКС/МИН ТЕМПЕРАТУРА
      setTextContent(
        ".temp-high",
        Math.round(daily.temperature_2m_max[0]) + "°",
      );
      setTextContent(
        ".temp-low",
        Math.round(daily.temperature_2m_min[0]) + "°",
      );

      // ПОЧАСОВОЙ ПРОГНОЗ
      renderHourlyForecast(hourly);

      // НЕДЕЛЬНЫЙ ПРОГНОЗ
      renderDailyForecast(daily);

      console.log("✅ Вся погода загружена!");
      document.body.classList.remove("loading");
    }
  } catch (error) {
    console.error("❌ Ошибка:", error);
    document.body.classList.remove("loading");
  }
}

//
initSlider("#hourly-card", ".hourly-nav-prev", ".hourly-nav-next", 86, 3);
initSlider("#daily-card", ".daily-nav-prev", ".daily-nav-next", 180, 1);

// Регистрация service worker для PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("✅ Service Worker зарегистрирован:", registration);
      })
      .catch((error) => {
        console.log("❌ Ошибка регистрации Service Worker:", error);
      });
  });
}

window.addEventListener("load", getWeather);

// обн каждые 10 минут
setInterval(getWeather, 10 * 60 * 1000);
