document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");

  // Al cargar la página, revisa si hay un tema guardado en localStorage
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }

  // Mostrar el ícono correcto al cargar
  updateIcons(savedTheme);

  // Evento al hacer clic en el botón
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    // Detectar nuevo tema
    const isDark = document.body.classList.contains("dark-mode");
    const newTheme = isDark ? "dark" : "light";

    // Guardar preferencia
    localStorage.setItem("theme", newTheme);

    // Actualizar íconos
    updateIcons(newTheme);

    // Reiniciar partículas y clima si los usas
    const particlesContainer = document.getElementById("particles-js");
    if (particlesContainer) {
      particlesContainer.innerHTML = "";
      initParticles(); // tu función de partículas
    }
    if (typeof loadWeather === "function") {
      loadWeather(); // tu función del clima
    }
  });

  // Función para mostrar/ocultar íconos
  function updateIcons(theme) {
    const moonIcon = toggle.querySelector(".icon-moon");
    const sunIcon = toggle.querySelector(".icon-sun");

    if (theme === "dark") {
      moonIcon.style.display = "none";
      sunIcon.style.display = "inline-flex";
    } else {
      moonIcon.style.display = "inline-flex";
      sunIcon.style.display = "none";
    }
  }
});


const WEATHER_API_KEY = "8a33fa8635d6adf10672a0fa18b68316";
const WEATHER_CITY = "Morelia";
const WEATHER_UNITS = "metric";

// Carrusel de imágenes segmentadas con 5 imágenes
class SegmentedCarousel {
  constructor() {
    this.currentSlide = 0;
    this.totalSlides = 5; // Cambiado a 5
    this.autoPlayInterval = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.startAutoPlay();
  }

  setupEventListeners() {
    // Event listeners para los puntos del carrusel
    document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      dot.addEventListener("click", () => {
        this.goToSlide(index);
      });
    });

    // Pausar carrusel al hacer hover
    const modelContainer = document.querySelector(".model-container");
    modelContainer.addEventListener("mouseenter", () => {
      this.stopAutoPlay();
    });

    modelContainer.addEventListener("mouseleave", () => {
      this.startAutoPlay();
    });
  }

  goToSlide(slideIndex) {
    this.currentSlide = slideIndex;

    // Actualizar imágenes activas en todos los segmentos
    document.querySelectorAll(".model-segment").forEach((segment) => {
      const images = segment.querySelectorAll("img");
      images.forEach((img, index) => {
        img.classList.toggle("active", index === slideIndex);
      });
    });

    // Actualizar puntos activos
    document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === slideIndex);
    });
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.goToSlide(this.currentSlide);
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 3500); // Cambiar cada 3.5 segundos para 5 imágenes
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }
}

// Función para cargar la foto de perfil desde localStorage
function loadProfilePhoto() {
  const userIcon = document.getElementById("userIcon");
  const savedImage = localStorage.getItem("profileImage");
  const hasProfileImage = localStorage.getItem("hasProfileImage");

  if (hasProfileImage === "true" && savedImage) {
    // Si hay foto guardada, mostrarla
    userIcon.innerHTML = `<img src="${savedImage}" alt="Foto de perfil">`;
  } else {
    // Si no hay foto, mostrar el icono por defecto
    userIcon.innerHTML = '<i class="fas fa-user default-icon"></i>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const sideMenu = document.querySelector(".side-menu");
  const menuOverlay = document.querySelector(".menu-overlay");

  menuToggle.addEventListener("click", () => {
    sideMenu.classList.toggle("active");
    menuOverlay.classList.toggle("active");
  });

  menuOverlay.addEventListener("click", () => {
    sideMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
  });

  // NUEVO: Funcionalidad del dropdown de usuario
  const profileDropdown = document.getElementById("profileDropdown");
  const userIcon = document.getElementById("userIcon");

  userIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("active");
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!profileDropdown.contains(e.target)) {
      profileDropdown.classList.remove("active");
    }
  });

  // Cargar foto de perfil
  loadProfilePhoto();

  loadWeather();

  // Inicializar carrusel
  new SegmentedCarousel();
});

async function loadWeather() {
  const weatherElement = document.getElementById("weather-display");

  if (!weatherElement) return;

  try {
    weatherElement.innerHTML = `
                    <div class="flex items-center gap-2 text-gray-700 font-semibold">
                        <i class="fas fa-spinner fa-spin text-yellow-500"></i>
                        <span>Cargando clima...</span>
                    </div>
                `;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CITY}&units=${WEATHER_UNITS}&appid=${WEATHER_API_KEY}&lang=es`
    );

    if (!response.ok) {
      throw new Error("Error al obtener datos del clima");
    }

    const data = await response.json();

    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;

    // Mapear iconos de OpenWeatherMap a Font Awesome
    const iconMap = {
      "01d": "fa-sun",
      "01n": "fa-moon",
      "02d": "fa-cloud-sun",
      "02n": "fa-cloud-moon",
      "03d": "fa-cloud",
      "03n": "fa-cloud",
      "04d": "fa-cloud",
      "04n": "fa-cloud",
      "09d": "fa-cloud-rain",
      "09n": "fa-cloud-rain",
      "10d": "fa-cloud-sun-rain",
      "10n": "fa-cloud-moon-rain",
      "11d": "fa-bolt",
      "11n": "fa-bolt",
      "13d": "fa-snowflake",
      "13n": "fa-snowflake",
      "50d": "fa-smog",
      "50n": "fa-smog",
    };

    const weatherIconClass = iconMap[iconCode] || "fa-cloud-sun";
    const iconColor = getIconColor(iconCode);

    weatherElement.innerHTML = `
                    <div class="flex items-center gap-2 text-gray-700 font-semibold" title="${description}">
                        <i class="fas ${weatherIconClass} ${iconColor}"></i>
                        <span>${temperature}°C</span>
                    </div>
                `;
  } catch (error) {
    console.error("Error fetching weather:", error);
    // por si falla la API mostrar eso
    weatherElement.innerHTML = `
                    <div class="flex items-center gap-2 text-gray-700 font-semibold">
                        <i class="fas fa-cloud-sun text-yellow-500"></i>
                        <span>22°C</span>
                    </div>
                `;
  }
}

// Función para determinar el color del icono según el clima
function getIconColor(iconCode) {
  const colorMap = {
    "01d": "text-yellow-500",
    "01n": "text-blue-300",
    "02d": "text-orange-400",
    "02n": "text-blue-400",
    "03d": "text-gray-400",
    "03n": "text-gray-400",
    "04d": "text-gray-500",
    "04n": "text-gray-500",
    "09d": "text-blue-500",
    "09n": "text-blue-500",
    "10d": "text-blue-600",
    "10n": "text-blue-600",
    "11d": "text-purple-500",
    "11n": "text-purple-500",
    "13d": "text-blue-200",
    "13n": "text-blue-200",
    "50d": "text-gray-300",
    "50n": "text-gray-300",
  };
  return colorMap[iconCode] || "text-yellow-500";
}

// ✅ NUEVO: Event listener para el botón de favoritos
document.addEventListener("DOMContentLoaded", function () {
  // Event listener para el botón de favoritos en el header
  document.querySelectorAll(".favorites-trigger").forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();

      // Guardar en sessionStorage que queremos ir a Favoritos
      sessionStorage.setItem("defaultFilter", "Favoritos");

      // Redirigir al armario
      window.location.href = "{% url 'my_closet' %}";
    });
  });
});
