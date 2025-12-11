
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

// Validación del formulario
function setupFormValidation() {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Resetear errores
        clearErrors();
        
        // Obtener valores
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const submitBtn = document.getElementById('submitBtn');
        
        let isValid = true;
        
        // Validar nombre
        if (!name) {
            showError('name-error', 'El nombre es obligatorio');
            isValid = false;
        } else if (name.length < 2) {
            showError('name-error', 'El nombre debe tener al menos 2 caracteres');
            isValid = false;
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
            showError('name-error', 'El nombre solo puede contener letras y espacios');
            isValid = false;
        }
        
        // Validar email
        if (!email) {
            showError('email-error', 'El correo electrónico es obligatorio');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('email-error', 'Ingresa un correo electrónico válido');
            isValid = false;
        }
        
        // Si todo es válido, enviar el formulario
        if (isValid) {
            submitBtn.classList.add('loading');
            
            // Simular envío al servidor
            setTimeout(() => {
                submitBtn.classList.remove('loading');
                this.submit();
            }, 1000);
        }
    });
}

// Inicio de sesión con Google
function setupGoogleLogin() {
    const googleLoginBtn = document.getElementById('googleLogin');
    
    googleLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const btn = this;
        btn.classList.add('loading');
        
        // Redirigir a la vista de Google Login
        window.location.href = '/google-login/';
        
        // Opcional: quitar la clase loading después de 3 segundos por si hay error
        setTimeout(() => {
            btn.classList.remove('loading');
        }, 3000);
    });
}

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para mostrar errores
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    const inputField = errorElement.previousElementSibling;
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    inputField.classList.add('error');
}

// Función para limpiar errores
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
    
    const inputFields = document.querySelectorAll('.input-field');
    inputFields.forEach(field => {
        field.classList.remove('error');
    });
}

// Validación en tiempo real
function setupRealTimeValidation() {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    
    nameInput.addEventListener('input', function() {
        const nameError = document.getElementById('name-error');
        if (nameError.style.display === 'block') {
            clearErrors();
        }
    });
    
    emailInput.addEventListener('input', function() {
        const emailError = document.getElementById('email-error');
        if (emailError.style.display === 'block') {
            clearErrors();
        }
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
    setupGoogleLogin();
    setupRealTimeValidation();
    adjustContainerHeight();
    
    // Ajustar altura cuando cambie el tamaño de la ventana
    window.addEventListener('resize', adjustContainerHeight);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);