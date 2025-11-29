
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
    updateIcons(newTheme); });
    
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

// Variables globales
const CAMERA_URL = "{% url 'camera' %}";
const CATEGORIA_DATA = {
    'calzado': {
        'title': 'Calzado',
        'tipos': ['Zapatos formales', 'Tenis deportivos', 'Sandalias', 'Botas', 'Mocasines', 'Zapatillas']
    },
    'prenda': {
        'title': 'Prenda de Vestir',
        'tipos': ['Camisa', 'Pantalón', 'Vestido', 'Falda', 'Blusa', 'Suéter', 'Chaqueta', 'Abrigo', 'Shorts', 'Traje']
    },
    'accesorio': {
        'title': 'Accesorio',
        'tipos': ['Bolso', 'Collar', 'Pulsera', 'Reloj', 'Gafas de sol', 'Sombrero', 'Bufanda', 'Cinturón', 'Cartera']
    }
};

// Configuración de partículas
particlesJS('particles-js', {
    particles: {
        number: {
            value: 40,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: ['#bda16e', '#837560', '#5B9B9D']
        },
        shape: {
            type: 'circle',
            stroke: {
                width: 0,
                color: '#000000'
            }
        },
        opacity: {
            value: 0.3,
            random: true,
            anim: {
                enable: true,
                speed: 1,
                opacity_min: 0.1,
                sync: false
            }
        },
        size: {
            value: 5,
            random: true,
            anim: {
                enable: true,
                speed: 2,
                size_min: 0.1,
                sync: false
            }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: '#bda16e',
            opacity: 0.2,
            width: 1
        },
        move: {
            enable: true,
            speed: 1,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
            attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200
            }
        }
    },
    interactivity: {
        detect_on: 'canvas',
        events: {
            onhover: {
                enable: true,
                mode: 'grab'
            },
            onclick: {
                enable: true,
                mode: 'push'
            },
            resize: true
        },
        modes: {
            grab: {
                distance: 140,
                line_linked: {
                    opacity: 0.5
                }
            },
            push: {
                particles_nb: 4
            }
        }
    },
    retina_detect: true
});

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del menú lateral
    const menuToggle = document.querySelector('.menu-toggle');
    const sideMenu = document.querySelector('.side-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    
    // Elementos del dropdown de usuario
    const profileDropdown = document.getElementById('profileDropdown');
    const userIcon = document.getElementById('userIcon');
    
    // Elementos del formulario
    const categoryOptions = document.querySelectorAll('.category-option');
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const categoriaInput = document.getElementById('categoria');
    const tipoSelect = document.getElementById('tipo');
    const cancelFormBtn = document.getElementById('cancel-form');
    const prendaForm = document.getElementById('prenda-form');
    
    // Elementos del selector de colores
    const colorInput = document.getElementById('color');
    const colorSelection = document.getElementById('color-selection');
    const colorOptions = document.querySelectorAll('.color-option');
    const customColorInput = document.getElementById('custom-color');
    const colorPreview = document.getElementById('color-preview');
    const toggleCustomColor = document.getElementById('toggle-custom-color');
    
    // Variables de estado
    let selectedCategory = null;
    let selectedColor = null;
    let isCustomColor = false;
    
    // Inicializar eventos
    initMenuEvents();
    initUserDropdownEvents();
    initCategoryEvents();
    initColorEvents();
    initFormEvents();
    
    // Cargar información del clima
    loadWeather();
    
    // Funciones de inicialización de eventos
    function initMenuEvents() {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.toggle('active');
            menuOverlay.classList.toggle('active');
        });
        
        menuOverlay.addEventListener('click', () => {
            sideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        });
    }
    
    function initUserDropdownEvents() {
        userIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
    
    function initCategoryEvents() {
        // Manejar selección de categoría
        categoryOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remover selección anterior
                categoryOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Marcar como seleccionada
                this.classList.add('selected');
                selectedCategory = this.dataset.category;
                
                // Mostrar formulario
                showForm(selectedCategory);
            });
        });
    }
    
    function initColorEvents() {
        // Manejar selección de color predefinido
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Solo procesar si no es el contenedor de color personalizado
                if (!this.classList.contains('custom-color-input')) {
                    // Remover selección anterior
                    colorOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // Marcar como seleccionado
                    this.classList.add('selected');
                    
                    // Obtener datos del color
                    const colorName = this.dataset.color;
                    const colorHex = this.dataset.hex;
                    
                    // Actualizar campo oculto
                    colorInput.value = colorName;
                    selectedColor = colorName;
                    isCustomColor = false;
                    
                    // Ocultar inputs de color personalizado
                    customColorInput.style.display = 'none';
                    colorPreview.style.display = 'none';
                }
            });
        });

        // Toggle para color personalizado
        toggleCustomColor.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Mostrar/ocultar inputs de color personalizado
            const isVisible = customColorInput.style.display === 'block';
            
            if (!isVisible) {
                // Mostrar inputs personalizados
                customColorInput.style.display = 'block';
                colorPreview.style.display = 'flex';
                
                // Deseleccionar colores predefinidos
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Limpiar y enfocar input
                customColorInput.value = '';
                customColorInput.focus();
                
                isCustomColor = true;
            } else {
                // Ocultar inputs personalizados
                customColorInput.style.display = 'none';
                colorPreview.style.display = 'none';
                isCustomColor = false;
            }
        });

        // Actualizar vista previa del color personalizado
        customColorInput.addEventListener('input', function() {
            const colorValue = this.value.trim();
            
            if (colorValue) {
                // Actualizar campo oculto
                colorInput.value = colorValue;
                selectedColor = colorValue;
                
                // Actualizar vista previa
                colorPreview.textContent = colorValue;
                colorPreview.style.backgroundColor = getColorHex(colorValue);
                
                // Ajustar color del texto según el fondo
                const hexColor = getColorHex(colorValue);
                const brightness = getColorBrightness(hexColor);
                colorPreview.style.color = brightness > 128 ? '#000000' : '#FFFFFF';
            } else {
                colorPreview.textContent = 'Vista previa';
                colorPreview.style.backgroundColor = '#f0f0f0';
                colorPreview.style.color = '#000000';
            }
        });
    }
    
    function initFormEvents() {
        // Cancelar formulario
        cancelFormBtn.addEventListener('click', function() {
            // Ocultar formulario
            formContainer.classList.remove('active');
            setTimeout(() => {
                formContainer.style.display = 'none';
            }, 300);
            
            // Deseleccionar categoría
            categoryOptions.forEach(opt => opt.classList.remove('selected'));
            selectedCategory = null;
            
            // Desplazar hacia las categorías
            document.querySelector('.category-selection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        });
        
        // Enviar formulario
        prendaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar formulario
            if (!validateForm()) {
                return;
            }
            
            // Recopilar datos del formulario
            const formData = {
                categoria: categoriaInput.value,
                tipo: tipoSelect.value,
                color: colorInput.value,
                temporada: document.getElementById('temporada').value,
                estilo: document.getElementById('estilo').value,
                esFavorito: document.getElementById('esFavorito').checked
            };
            
            // Guardar datos en sessionStorage para usar en la cámara
            sessionStorage.setItem('prendaData', JSON.stringify(formData));
            
            // Redirigir a la cámara
            window.location.href = CAMERA_URL;
        });
        
        // Event listener para el botón de favoritos
        document.querySelectorAll('.favorites-trigger').forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Guardar en sessionStorage que queremos ir a Favoritos
                sessionStorage.setItem('defaultFilter', 'Favoritos');
                
                // Redirigir al armario
                window.location.href = "{% url 'my_closet' %}";
            });
        });
    }
    
    // Funciones de utilidad
    function showForm(category) {
        const categoryData = CATEGORIA_DATA[category];
        
        // Actualizar título del formulario
        formTitle.textContent = `Detalles del ${categoryData.title}`;
        
        // Establecer categoría en el campo oculto
        categoriaInput.value = category;
        
        // Llenar opciones de tipo
        tipoSelect.innerHTML = '<option value="">Selecciona un tipo</option>';
        categoryData.tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            tipoSelect.appendChild(option);
        });
        
        // Mostrar formulario con animación
        formContainer.style.display = 'block';
        setTimeout(() => {
            formContainer.classList.add('active');
        }, 10);
        
        // Desplazar hacia el formulario
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function validateForm() {
        let isValid = true;
        
        // Validar tipo
        if (!tipoSelect.value) {
            showFieldError(tipoSelect, 'Por favor selecciona un tipo');
            isValid = false;
        } else {
            clearFieldError(tipoSelect);
        }
        
        // Validar color
        if (!colorInput.value.trim()) {
            showFieldError(colorSelection.parentNode, 'Por favor selecciona un color');
            isValid = false;
        } else {
            clearFieldError(colorSelection.parentNode);
        }
        
        return isValid;
    }
    
    function showFieldError(field, message) {
        field.style.borderColor = '#e06e78';
        
        // Remover mensaje de error existente
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Crear mensaje de error
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.color = '#e06e78';
        errorElement.style.fontSize = '0.8em';
        errorElement.style.marginTop = '5px';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }
    
    function clearFieldError(field) {
        field.style.borderColor = 'rgba(189, 161, 110, 0.3)';
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
});

// Función para obtener código hex de un color por nombre
function getColorHex(colorName) {
    const colorMap = {
        'Negro': '#000000',
        'Blanco': '#FFFFFF',
        'Gris': '#808080',
        'Gris oscuro': '#404040',
        'Gris claro': '#C0C0C0',
        'Rojo': '#FF0000',
        'Rojo oscuro': '#8B0000',
        'Naranja': '#FFA500',
        'Coral': '#FF7F50',
        'Rosa': '#FFC0CB',
        'Azul': '#0000FF',
        'Azul marino': '#000080',
        'Azul claro': '#87CEEB',
        'Verde': '#008000',
        'Verde oscuro': '#006400',
        'Marrón': '#8B4513',
        'Beige': '#F5F5DC',
        'Caqui': '#F0E68C',
        'Crema': '#FFFDD0',
        'Morado': '#800080',
        'Lila': '#C8A2C8',
        'Turquesa': '#40E0D0',
        'Amarillo': '#FFFF00',
        'Dorado': '#FFD700'
    };
    
    // Buscar coincidencia exacta primero
    if (colorMap[colorName]) {
        return colorMap[colorName];
    }
    
    // Buscar coincidencia parcial
    for (const [key, value] of Object.entries(colorMap)) {
        if (colorName.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    
    // Si no se encuentra, usar un color por defecto
    return '#CCCCCC';
}

// Función para calcular brillo de color (para determinar color de texto)
function getColorBrightness(hexColor) {
    // Convertir hex a RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calcular brillo (fórmula estándar)
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// Función para cargar el clima
async function loadWeather() {
    const WEATHER_API_KEY = '8a33fa8635d6adf10672a0fa18b68316';
    const WEATHER_CITY = 'Morelia'; 
    const WEATHER_UNITS = 'metric';
    
    const weatherElement = document.getElementById('weather-display');
    
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
            throw new Error('Error al obtener datos del clima');
        }

        const data = await response.json();
        
        const temperature = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        
        // Mapear iconos de OpenWeatherMap a Font Awesome
        const iconMap = {
            '01d': 'fa-sun',           
            '01n': 'fa-moon',          
            '02d': 'fa-cloud-sun',    
            '02n': 'fa-cloud-moon',    
            '03d': 'fa-cloud',         
            '03n': 'fa-cloud',
            '04d': 'fa-cloud',         
            '04n': 'fa-cloud',
            '09d': 'fa-cloud-rain',    
            '09n': 'fa-cloud-rain',
            '10d': 'fa-cloud-sun-rain',
            '10n': 'fa-cloud-moon-rain',
            '11d': 'fa-bolt',          
            '11n': 'fa-bolt',
            '13d': 'fa-snowflake',     
            '13n': 'fa-snowflake',
            '50d': 'fa-smog',          
            '50n': 'fa-smog'
        };

        const weatherIconClass = iconMap[iconCode] || 'fa-cloud-sun';
        const iconColor = getIconColor(iconCode);

        weatherElement.innerHTML = `
            <div class="flex items-center gap-2 text-gray-700 font-semibold" title="${description}">
                <i class="fas ${weatherIconClass} ${iconColor}"></i>
                <span>${temperature}°C</span>
            </div>
        `;

    } catch (error) {
        console.error('Error fetching weather:', error);
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
        '01d': 'text-yellow-500',    
        '01n': 'text-blue-300',      
        '02d': 'text-orange-400',      
        '02n': 'text-blue-400',        
        '03d': 'text-gray-400',     
        '03n': 'text-gray-400',
        '04d': 'text-gray-500',       
        '04n': 'text-gray-500',
        '09d': 'text-blue-500',       
        '09n': 'text-blue-500',
        '10d': 'text-blue-600',       
        '10n': 'text-blue-600',
        '11d': 'text-purple-500',   
        '11n': 'text-purple-500',
        '13d': 'text-blue-200',      
        '13n': 'text-blue-200',
        '50d': 'text-gray-300',       
        '50n': 'text-gray-300'
    };
    return colorMap[iconCode] || 'text-yellow-500';
}