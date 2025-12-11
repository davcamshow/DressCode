document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");

  function updateIcons(theme) {
    const moon = document.querySelector(".icon-moon");
    const sun = document.querySelector(".icon-sun");

    if (theme === "dark") {
      moon.style.display = "none";
      sun.style.display = "inline-flex";
    } else {
      moon.style.display = "inline-flex";
      sun.style.display = "none";
    }
  }

  const savedTheme = localStorage.getItem("theme") || "light";

  if (savedTheme === "dark") {
    document.body.classList.add("dark"); // ← AQUÍ CAMBIADO
  }

  updateIcons(savedTheme);

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark"); // ← AQUÍ CAMBIADO

    const isDark = document.body.classList.contains("dark");
    const newTheme = isDark ? "dark" : "light";

    localStorage.setItem("theme", newTheme);
    updateIcons(newTheme);
  });
});




/* ======================================
   TU CÓDIGO ORIGINAL COMPLETO
====================================== */

// Inicializar fondo dinámico con partículas similares al register
function initDynamicBackground() {
  const canvas = document.getElementById('dynamic-bg');
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  const particles = [];
  const particleCount = 35;
  const colors = [
    'rgba(217, 83, 79, 0.18)',
    'rgba(139, 108, 77, 0.12)',
    'rgba(180, 154, 125, 0.15)',
    'rgba(160, 130, 100, 0.1)',
    'rgba(107, 68, 35, 0.15)'
  ];
  
  // Crear partículas
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 1,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.2 + 0.1,
      originalSize: 0
    });
    
    particles[i].originalSize = particles[i].size;
  }
  
  // Efecto de interacción con el mouse
  let mouseX = 0;
  let mouseY = 0;
  let mouseRadius = 120;
  
  canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  });
  
  canvas.addEventListener('mouseleave', function() {
    mouseX = 0;
    mouseY = 0;
  });
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Gradiente de fondo mejorado
    const gradient = ctx.createRadialGradient(
      canvas.width * 0.7,
      canvas.height * 0.3,
      0,
      canvas.width * 0.7,
      canvas.height * 0.3,
      Math.max(canvas.width, canvas.height) * 0.6
    );
    
    gradient.addColorStop(0, 'rgba(248, 244, 240, 0.1)');
    gradient.addColorStop(0.5, 'rgba(232, 223, 212, 0.05)');
    gradient.addColorStop(1, 'rgba(212, 196, 176, 0.02)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Actualizar y dibujar partículas
    particles.forEach(particle => {
      // Interacción con el mouse
      const dx = particle.x - mouseX;
      const dy = particle.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouseRadius && mouseX !== 0 && mouseY !== 0) {
        const force = (mouseRadius - distance) / mouseRadius;
        const angle = Math.atan2(dy, dx);
        
        particle.x += Math.cos(angle) * force * 1.5;
        particle.y += Math.sin(angle) * force * 1.5;
        particle.size = particle.originalSize * (1 + force * 0.3);
      } else {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.size = particle.originalSize;
      }
      
      // Rebotar en los bordes
      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      
      // Dibujar partícula
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Crear partículas flotantes internas
function createFloatingParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 8;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    const size = Math.random() * 10 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100 + 100}%`;
    particle.style.animationDelay = `${Math.random() * 12}s`;
    particle.style.animationDuration = `${Math.random() * 8 + 8}s`;
    particle.style.opacity = Math.random() * 0.4 + 0.2;
    
    particlesContainer.appendChild(particle);
  }
}

// Validación del formulario
function setupFormValidation() {
  const recoveryForm = document.querySelector('.form-recuperar');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('submitBtn');
  const emailError = document.getElementById('email-error');
  
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Resetear errores
      clearErrors();
      
      const email = emailInput.value.trim();
      let isValid = true;
      
      // Validar email
      if (!email) {
        showError('email-error', 'El correo electrónico es obligatorio');
        emailInput.classList.add('error');
        isValid = false;
      } else if (!isValidEmail(email)) {
        showError('email-error', 'Ingresa un correo electrónico válido');
        emailInput.classList.add('error');
        isValid = false;
      }
      
      // Si todo es válido, enviar el formulario
      if (isValid) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Simular envío al servidor
        setTimeout(() => {
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
          this.submit();
        }, 1500);
      }
    });
  }
  
  // Validación en tiempo real
  if (emailInput) {
    emailInput.addEventListener('input', function() {
      if (this.value.trim()) {
        clearErrors();
        this.classList.remove('error');
      }
    });
  }
}

// Función para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para mostrar errores
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
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

// Efectos de hover mejorados
function initHoverEffects() {
  const recoveryContainer = document.querySelector('.pantalla-recuperar');
  
  if (recoveryContainer) {
    recoveryContainer.addEventListener('mouseenter', function() {
      document.body.style.background = 'linear-gradient(135deg, #f9f6f2 0%, #eae2d9 50%, #d9ccbd 100%)';
    });
    
    recoveryContainer.addEventListener('mouseleave', function() {
      document.body.style.background = 'linear-gradient(135deg, #f8f4f0 0%, #e8dfd4 50%, #d4c4b0 100%)';
    });
  }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  initDarkMode(); // ← AÑADIDO
  initDynamicBackground();
  createFloatingParticles();
  initHoverEffects();
  setupFormValidation();
  
  // Efecto de aparición suave para el formulario
  const recoveryContainer = document.querySelector('.pantalla-recuperar');
  if (recoveryContainer) {
    recoveryContainer.style.opacity = '0';
    recoveryContainer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      recoveryContainer.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      recoveryContainer.style.opacity = '1';
      recoveryContainer.style.transform = 'translateY(0)';
    }, 100);
  }
});
