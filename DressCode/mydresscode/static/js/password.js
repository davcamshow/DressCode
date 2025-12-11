
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


// -------------------------------------------
// ⭐ TU CÓDIGO ORIGINAL (NO MODIFICADO)
// -------------------------------------------

// Elementos del DOM
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqNumber = document.getElementById('req-number');
const reqSpecial = document.getElementById('req-special');
const errorMessage = document.getElementById('error-message');
const submitBtn = document.getElementById('submitBtn');

// Crear partículas de fondo
function createBackgroundParticles() {
    const container = document.getElementById('bg-particles');
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('bg-particle');
        
        const size = Math.random() * 80 + 15;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100 + 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${Math.random() * 20 + 20}s`;
        particle.style.opacity = Math.random() * 0.08 + 0.03;
        
        container.appendChild(particle);
    }
}

// Crear partículas decorativas internas
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 15 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100 + 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Validar contraseña en tiempo real
function validatePassword(password) {
    reqLength.classList.toggle('valid', password.length >= 8);
    reqUppercase.classList.toggle('valid', /[A-Z]/.test(password));
    reqNumber.classList.toggle('valid', /[0-9]/.test(password));
    reqSpecial.classList.toggle('valid', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
}

// Mostrar mensaje de error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Configurar validación del formulario
function setupFormValidation() {
    const passwordForm = document.getElementById('passwordForm');
    
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            confirmPasswordInput.classList.add('error');
            return;
        } else {
            confirmPasswordInput.classList.remove('error');
        }

        // Validar requisitos de contraseña
        if (
            password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        ) {
            showError('La contraseña no cumple con los requisitos');
            return;
        }

        // Envío exitoso
        submitBtn.classList.add('loading');
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            this.submit();
        }, 1000);
    });
}

// Configurar eventos de entrada
function setupInputEvents() {
    passwordInput.addEventListener('input', function() {
        validatePassword(this.value);
    });
}

// Ajustar altura del contenedor en pantallas pequeñas
function adjustContainerHeight() {
    const container = document.querySelector('.container');
    const windowHeight = window.innerHeight;
    const containerHeight = container.scrollHeight;
    
    if (windowHeight < 600 && containerHeight > windowHeight - 40) {
        container.style.marginTop = '10px';
        container.style.marginBottom = '10px';
    } else {
        container.style.marginTop = 'auto';
        container.style.marginBottom = 'auto';
    }
}

// Inicializar la aplicación
function initApp() {
    createBackgroundParticles();
    createParticles();
    setupFormValidation();
    setupInputEvents();
    adjustContainerHeight();

    // MODO OSCURO
    setupDarkMode();

    // Ajustar altura cuando cambie el tamaño de la ventana
    window.addEventListener('resize', adjustContainerHeight);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);
