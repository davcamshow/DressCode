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

// Carrusel de imágenes segmentadas con segmentos TOTAMENTE independientes
class SegmentedCarousel {
  constructor() {
    this.segments = []; // Cada segmento es un carrusel independiente
    this.init();
  }

  init() {
    this.setupSegments();
    this.setupEventListeners();
  }

  setupSegments() {
    // Crear carruseles independientes para cada segmento
    const segments = [
      { element: '.segment-1', name: 'Segmento 1' },
      { element: '.segment-2', name: 'Segmento 2' },
      { element: '.segment-3', name: 'Segmento 3' }
    ];
    
    segments.forEach((segmentInfo, index) => {
      const segmentElement = document.querySelector(segmentInfo.element);
      if (segmentElement) {
        // Crear un carrusel independiente para este segmento
        const segmentCarousel = new IndependentSegmentCarousel(segmentElement, index);
        this.segments.push(segmentCarousel);
      }
    });
  }

  setupEventListeners() {
    // Los puntos del carrusel controlan TODOS los segmentos a la vez
    document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        // Cambiar TODOS los segmentos a este slide
        this.segments.forEach(segment => {
          segment.goToSlide(index);
          segment.resume(); // Reanudar si estaba pausado
        });
      });
    });
  }
}

// Carrusel INDEPENDIENTE para cada segmento
class IndependentSegmentCarousel {
  constructor(segmentElement, segmentId) {
    this.segment = segmentElement;
    this.segmentId = segmentId;
    this.currentSlide = Math.floor(Math.random() * 5); // Slide inicial aleatorio
    this.totalSlides = 5;
    this.autoPlayInterval = null;
    this.isPaused = false; // Estado de pausa
    this.isHovering = false;
    this.init();
  }

  init() {
    this.setupSegment();
    this.setupEventListeners();
    this.startAutoPlay();
  }

  setupSegment() {
    // Configurar atributos del segmento
    this.segment.dataset.segmentId = this.segmentId;
    this.segment.dataset.currentSlide = this.currentSlide;
    
    // Mostrar la imagen inicial correcta
    this.updateSegmentDisplay();
    
    // Agregar indicador de pausa
    const pauseIndicator = document.createElement('div');
    pauseIndicator.className = 'segment-pause-indicator';
    pauseIndicator.innerHTML = '<i class="fas fa-pause"></i>';
    this.segment.appendChild(pauseIndicator);
  }

  setupEventListeners() {
    // Click en el segmento para pausar/reanudar
    this.segment.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });
    
    // Click en imágenes del segmento
    const images = this.segment.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePause();
      });
    });
    
    // Hover
    this.segment.addEventListener('mouseenter', () => {
      this.isHovering = true;
      this.stopAutoPlay();
    });
    
    this.segment.addEventListener('mouseleave', () => {
      this.isHovering = false;
      if (!this.isPaused) {
        this.startAutoPlay();
      }
    });
  }

  goToSlide(slideIndex) {
    this.currentSlide = slideIndex;
    this.segment.dataset.currentSlide = slideIndex;
    this.updateSegmentDisplay();
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.segment.dataset.currentSlide = this.currentSlide;
    this.updateSegmentDisplay();
  }

  updateSegmentDisplay() {
    const images = this.segment.querySelectorAll("img");
    images.forEach((img, index) => {
      img.classList.toggle("active", index === this.currentSlide);
    });
  }

  startAutoPlay() {
    // No iniciar si está pausado
    if (this.isPaused) return;
    
    // Limpiar intervalo anterior si existe
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    
    // Intervalo aleatorio para cada segmento (entre 2.5 y 4 segundos)
    const interval = Math.floor(Math.random() * 1500) + 2500;
    
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, interval);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.stopAutoPlay();
      this.segment.classList.add('paused');
      this.showPauseIndicator();
    } else {
      this.segment.classList.remove('paused');
      if (!this.isHovering) {
        this.startAutoPlay();
      }
    }
  }

  resume() {
    this.isPaused = false;
    this.segment.classList.remove('paused');
    if (!this.isHovering) {
      this.startAutoPlay();
    }
  }

  showPauseIndicator() {
    const indicator = this.segment.querySelector('.segment-pause-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
      indicator.classList.add('show');
      
      setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => {
          if (!indicator.classList.contains('show')) {
            indicator.style.display = 'none';
          }
        }, 300);
      }, 1500);
    }
  }
}

// Clase para manejar carruseles individuales en accesorios (MANTENIDO IGUAL)
class AccessoryCarousel {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentIndex = 0;
    this.images = [];
    this.autoPlayInterval = null;
    this.isPausedByClick = false;
    this.isHovering = false;
    this.init();
  }

  init() {
    this.images = this.generateRandomImages();
    this.render();
    this.setupEventListeners();
    this.startAutoPlay();
  }

  generateRandomImages() {
    return window.accesoriosImagenes || [];
}


  render() {
    const carouselHTML = `
      <div class="accessory-carousel">
        <div class="accessory-carousel-images">
          ${this.images.map((img, index) => `
            <img src="${img}" 
                 alt="Accesorio ${index + 1}" 
                 class="accessory-carousel-image ${index === 0 ? 'active' : ''}">
          `).join('')}
        </div>
        <div class="accessory-carousel-nav">
          <button class="accessory-carousel-prev">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="accessory-carousel-next">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="accessory-carousel-controls">
          ${this.images.map((_, index) => `
            <div class="accessory-carousel-dot ${index === 0 ? 'active' : ''}" 
                 data-index="${index}"></div>
          `).join('')}
        </div>
        <div class="accessory-position-indicator">1/${this.images.length}</div>
        <div class="accessory-text">Accesorio ${this.container.dataset.id}</div>
        <div class="pause-indicator">
          <i class="fas fa-pause"></i>
        </div>
      </div>
      <button class="delete-btn" data-id="${this.container.dataset.id}">
        <i class="fas fa-times"></i>
      </button>
    `;

    this.container.innerHTML = carouselHTML;
  }

  setupEventListeners() {
    const prevBtn = this.container.querySelector('.accessory-carousel-prev');
    const nextBtn = this.container.querySelector('.accessory-carousel-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pauseByClick();
        this.prev();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pauseByClick();
        this.next();
      });
    }

    const dots = this.container.querySelectorAll('.accessory-carousel-dot');
    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pauseByClick();
        const index = parseInt(dot.dataset.index);
        this.goToSlide(index);
      });
    });

    const images = this.container.querySelectorAll('.accessory-carousel-image');
    images.forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pauseByClick();
      });
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container || 
          e.target.classList.contains('accessory-carousel') ||
          e.target.classList.contains('accessory-carousel-images')) {
        this.pauseByClick();
      }
    });

    this.container.addEventListener('mouseenter', () => {
      this.isHovering = true;
      if (!this.isPausedByClick) {
        this.stopAutoPlay();
      }
    });

    this.container.addEventListener('mouseleave', () => {
      this.isHovering = false;
      if (!this.isPausedByClick) {
        this.startAutoPlay();
      }
    });
  }

  goToSlide(index) {
    if (index < 0) index = this.images.length - 1;
    if (index >= this.images.length) index = 0;
    
    this.currentIndex = index;
    this.updateDisplay();
  }

  next() {
    this.goToSlide(this.currentIndex + 1);
  }

  prev() {
    this.goToSlide(this.currentIndex - 1);
  }

  updateDisplay() {
    const images = this.container.querySelectorAll('.accessory-carousel-image');
    const dots = this.container.querySelectorAll('.accessory-carousel-dot');
    const indicator = this.container.querySelector('.accessory-position-indicator');

    images.forEach((img, index) => {
      img.classList.toggle('active', index === this.currentIndex);
      img.classList.toggle('fade-in', index === this.currentIndex);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });

    if (indicator) {
      indicator.textContent = `${this.currentIndex + 1}/${this.images.length}`;
    }
  }

  startAutoPlay() {
    if (this.isPausedByClick) return;
    
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    
    const interval = Math.floor(Math.random() * 3000) + 3000;
    
    this.autoPlayInterval = setInterval(() => {
      this.next();
    }, interval);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  pauseByClick() {
    if (this.isPausedByClick) {
      this.isPausedByClick = false;
      if (!this.isHovering) {
        this.startAutoPlay();
      }
    } else {
      this.isPausedByClick = true;
      this.stopAutoPlay();
    }
    
    this.showPauseIndicator();
  }

  showPauseIndicator() {
    const indicator = this.container.querySelector('.pause-indicator');
    if (indicator) {
      indicator.classList.add('active');
      
      setTimeout(() => {
        indicator.classList.remove('active');
      }, 2000);
    }
  }

  destroy() {
    this.stopAutoPlay();
    this.container.innerHTML = '';
  }
}

// Función para cargar la foto de perfil desde localStorage
function loadProfilePhoto() {
  const userIcon = document.getElementById("userIcon");
  const savedImage = localStorage.getItem("profileImage");
  const hasProfileImage = localStorage.getItem("hasProfileImage");

  if (hasProfileImage === "true" && savedImage) {
    userIcon.innerHTML = `<img src="${savedImage}" alt="Foto de perfil">`;
  } else {
    userIcon.innerHTML = '<i class="fas fa-user default-icon"></i>';
  }
}

// Variables globales para accesorios
let accessories = [];
let accessoryCarousels = [];

// Instancia global del carrusel principal
let mainCarousel = null;

function initializeDefaultAccessories() {
  const accessoriesGrid = document.getElementById("accessoriesGrid");
  if (!accessoriesGrid) return;
  
  accessoriesGrid.innerHTML = '';
  accessories = [];
  accessoryCarousels = [];
  
  for (let i = 0; i < 3; i++) {
    addAccessory();
  }
}

function addAccessory() {
  const accessoriesGrid = document.getElementById("accessoriesGrid");
  if (!accessoriesGrid) return;
  
  const accessoryId = accessories.length + 1;
  
  const accessory = document.createElement("div");
  accessory.className = "accessory-container";
  accessory.dataset.id = accessoryId;
  
  accessoriesGrid.appendChild(accessory);
  accessories.push({
    id: accessoryId,
    element: accessory
  });
  
  const carousel = new AccessoryCarousel(accessory);
  accessoryCarousels.push(carousel);
  
  setTimeout(() => {
    const deleteBtn = accessory.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        removeAccessory(parseInt(this.dataset.id));
      });
    }
  }, 100);
  
  makeDraggable(accessory);
  
  return accessory;
}

function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;
  
  element.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    
    if (e.target.closest('.delete-btn') || 
        e.target.closest('.accessory-carousel-nav') ||
        e.target.closest('.accessory-carousel-dot') ||
        e.target.closest('.accessory-carousel-controls') ||
        e.target.closest('.accessory-carousel-image')) {
      return;
    }
    
    isDragging = true;
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    
    element.classList.add('dragging');
    element.style.position = "absolute";
    element.style.zIndex = "1000";
  }
  
  function elementDrag(e) {
    if (!isDragging) return;
    
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }
  
  function closeDragElement() {
    isDragging = false;
    document.onmouseup = null;
    document.onmousemove = null;
    
    element.classList.remove('dragging');
    
    setTimeout(() => {
      if (!element.parentNode) return;
      
      element.style.position = "relative";
      element.style.top = "auto";
      element.style.left = "auto";
      element.style.zIndex = "1";
      
      const accessoriesGrid = document.getElementById("accessoriesGrid");
      if (accessoriesGrid && !accessoriesGrid.contains(element)) {
        accessoriesGrid.appendChild(element);
      }
    }, 100);
  }
}

function removeAccessory(id) {
  const accessoryIndex = accessories.findIndex(acc => acc.id === id);
  
  if (accessoryIndex !== -1) {
    const accessory = accessories[accessoryIndex].element;
    
    const carouselIndex = accessoryCarousels.findIndex(c => 
      c.container === accessory
    );
    
    if (carouselIndex !== -1) {
      accessoryCarousels[carouselIndex].destroy();
      accessoryCarousels.splice(carouselIndex, 1);
    }
    
    accessory.classList.add('deleting');
    
    setTimeout(() => {
      if (accessory.parentNode) {
        accessory.parentNode.removeChild(accessory);
      }
      
      accessories.splice(accessoryIndex, 1);
      
      updateAccessoryNumbers();
    }, 300);
  }
}

function updateAccessoryNumbers() {
  accessories.forEach((accessory, index) => {
    const newId = index + 1;
    const accessoryText = accessory.element.querySelector('.accessory-text');
    if (accessoryText) {
      accessoryText.textContent = `Accesorio ${newId}`;
    }
    
    const deleteBtn = accessory.element.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.dataset.id = newId;
    }
    
    accessory.id = newId;
    accessory.element.dataset.id = newId;
  });
}

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
    weatherElement.innerHTML = `
      <div class="flex items-center gap-2 text-gray-700 font-semibold">
        <i class="fas fa-cloud-sun text-yellow-500"></i>
        <span>22°C</span>
      </div>
    `;
  }
}

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

// Inicialización principal
document.addEventListener("DOMContentLoaded", () => {
  // Menú lateral
  const menuToggle = document.querySelector(".menu-toggle");
  const sideMenu = document.querySelector(".side-menu");
  const menuOverlay = document.querySelector(".menu-overlay");

  if (menuToggle && sideMenu && menuOverlay) {
    menuToggle.addEventListener("click", () => {
      sideMenu.classList.toggle("active");
      menuOverlay.classList.toggle("active");
    });

    menuOverlay.addEventListener("click", () => {
      sideMenu.classList.remove("active");
      menuOverlay.classList.remove("active");
    });
  }

  // Dropdown de usuario
  const profileDropdown = document.getElementById("profileDropdown");
  const userIcon = document.getElementById("userIcon");

  if (profileDropdown && userIcon) {
    userIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove("active");
      }
    });
  }

  // Cargar foto de perfil
  loadProfilePhoto();

  // Cargar clima
  loadWeather();

  // Inicializar carrusel principal con segmentos TOTALMENTE independientes
  mainCarousel = new SegmentedCarousel();

  // Inicializar accesorios
  const toggleAccessoriesBtn = document.getElementById("toggle-accessories");
  const accessoriesPanel = document.getElementById("accessoriesPanel");
  const addAccessoryBtn = document.getElementById("addAccessoryBtn");
  const accessoriesGrid = document.getElementById("accessoriesGrid");

  if (toggleAccessoriesBtn && accessoriesPanel && addAccessoryBtn && accessoriesGrid) {

    // Si hay accesorios reales en BD, mostramos solo esos
    if (window.accesoriosImagenes && window.accesoriosImagenes.length > 0) {

        accessoriesGrid.innerHTML = "";  // limpiar

        const acc = document.createElement("div");
        acc.className = "accessory-container";
        acc.dataset.id = 1;
        accessoriesGrid.appendChild(acc);

        new AccessoryCarousel(acc);

    } else {
        // Si no hay accesorios en BD, cargar accesorios de prueba
        initializeDefaultAccessories();
    }

    // Toggle del panel de accesorios
    toggleAccessoriesBtn.addEventListener("click", function () {
        accessoriesPanel.classList.toggle("active");
        
        const icon = this.querySelector("i");
        if (accessoriesPanel.classList.contains("active")) {
            this.innerHTML = '<i class="fas fa-minus-circle"></i> Ocultar accesorios';
        } else {
            this.innerHTML = '<i class="fas fa-plus-circle"></i> Activar accesorios';
        }
    });

    // Añadir nuevo accesorio
    addAccessoryBtn.addEventListener("click", addAccessory);
  }


  // Botón de favoritos
  document.querySelectorAll(".favorites-trigger").forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      sessionStorage.setItem("defaultFilter", "Favoritos");
      window.location.href = "{% url 'my_closet' %}";
    });
  });
});