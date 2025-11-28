
// Toggle de modo oscuro/claro
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }
});
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
  const particleCount = 40;
  const colors = [
    'rgba(139, 108, 77, 0.25)',
    'rgba(180, 154, 125, 0.2)',
    'rgba(160, 130, 100, 0.18)',
    'rgba(212, 196, 176, 0.15)',
    'rgba(107, 68, 35, 0.22)'
  ];
  
  // Crear partículas
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.3 + 0.1,
      originalSize: 0
    });
    
    particles[i].originalSize = particles[i].size;
  }
  
  // Efecto de interacción con el mouse
  let mouseX = 0;
  let mouseY = 0;
  let mouseRadius = 100;
  
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
      canvas.width * 0.3,
      canvas.height * 0.7,
      0,
      canvas.width * 0.3,
      canvas.height * 0.7,
      Math.max(canvas.width, canvas.height) * 0.8
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
        
        particle.x += Math.cos(angle) * force * 2;
        particle.y += Math.sin(angle) * force * 2;
        particle.size = particle.originalSize * (1 + force * 0.5);
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
      
      // Efecto de brillo en algunas partículas
      if (Math.random() > 0.7) {
        const glow = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        glow.addColorStop(0, particle.color.replace('0.2', '0.4'));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
      } else {
        ctx.fillStyle = particle.color;
      }
      
      ctx.globalAlpha = particle.opacity;
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Crear partículas flotantes internas similares al register
function createFloatingParticles() {
  const particlesContainer = document.createElement('div');
  particlesContainer.classList.add('particles');
  document.querySelector('.pantalla-login').appendChild(particlesContainer);
  
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

// Efectos de hover mejorados para elementos de la página
function initHoverEffects() {
  const loginContainer = document.querySelector('.pantalla-login');
  const inputs = document.querySelectorAll('.login-form input');
  const labels = document.querySelectorAll('.login-form label');
  
  // Efecto sutil en el contenedor principal al hacer hover
  loginContainer.addEventListener('mouseenter', function() {
    if (!document.body.classList.contains('dark-mode')) {
        document.body.style.background = 'linear-gradient(135deg, #f9f6f2 0%, #eae2d9 50%, #d9ccbd 100%)';
      }
    });

  loginContainer.addEventListener('mouseleave', function() {
    if (!document.body.classList.contains('dark-mode')) {
      document.body.style.background = 'linear-gradient(135deg, #f8f4f0 0%, #e8dfd4 50%, #d4c4b0 100%)';
    }
  });
  
  // Efectos en labels al interactuar con inputs
  inputs.forEach((input, index) => {
    input.addEventListener('focus', function() {
      if (labels[index]) {
        labels[index].style.color = '#6b4423';
        labels[index].style.transform = 'translateX(5px)';
      }
    });
    
    input.addEventListener('blur', function() {
      if (labels[index] && !input.value) {
        labels[index].style.color = '#2a1a0f';
        labels[index].style.transform = 'translateX(0)';
      }
    });
  });
}

// Mostrar modal de éxito si hay un mensaje de éxito
function checkSuccessMessages() {
  const successMessages = document.querySelectorAll('.alert-success');
  if (successMessages.length > 0) {
    setTimeout(function() {
      document.getElementById('successModal').style.display = 'flex';
    }, 500);
  }
}

function closeSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
}

// Auto-cerrar mensajes después de 5 segundos
function autoCloseMessages() {
  setTimeout(function() {
    const messageContainer = document.querySelector('.message-container');
    if (messageContainer) {
      messageContainer.style.display = 'none';
    }
  }, 5000);
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  initDynamicBackground();
  createFloatingParticles();
  initHoverEffects();
  checkSuccessMessages();
  autoCloseMessages();
  
  // Cerrar modal al hacer clic fuera
  document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeSuccessModal();
    }
  });
  
  // Efecto de aparición suave para el formulario
  const loginForm = document.querySelector('.pantalla-login');
  if (loginForm) {
    loginForm.style.opacity = '0';
    loginForm.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      loginForm.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      loginForm.style.opacity = '1';
      loginForm.style.transform = 'translateY(0)';
    }, 100);
  }
});