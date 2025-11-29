// Script específico para la página Sobre Nosotros

// Inicialización de la página
document.addEventListener('DOMContentLoaded', function() {
  const aboutContainer = document.querySelector('.about-container');
  const topbar = document.querySelector('.topbar');
  
  // Ocultar inicialmente
  aboutContainer.style.opacity = '0';
  
  // Luego aplicar transición y mostrar
  setTimeout(() => {
    aboutContainer.style.transition = 'opacity 1s ease';
    aboutContainer.style.opacity = '1';
    
    // Iniciar fondo dinámico
    initDynamicBackground();
    
    // Configurar navegación del menú
    setupMenuNavigation();
    
    // Iniciar animaciones de scroll
    initScrollAnimations();
  }, 300);
});

// Configurar navegación de la barra superior
function setupMenuNavigation() {
  const menuItems = document.querySelectorAll('.topbar .menu-item');
  
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remover clase activa de todos los elementos
      menuItems.forEach(i => i.classList.remove('active'));
      
      // Agregar clase activa al elemento clickeado
      this.classList.add('active');
    });
  });
}

// Animaciones al hacer scroll
function initScrollAnimations() {
  const featureCards = document.querySelectorAll('.feature-card');
  const statItems = document.querySelectorAll('.stat-item');
  
  // Configurar Intersection Observer para animaciones
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Aplicar estilos iniciales y observar elementos
  featureCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
  
  statItems.forEach(stat => {
    stat.style.opacity = '0';
    stat.style.transform = 'translateY(20px)';
    stat.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(stat);
  });
}

// Contador animado para las estadísticas
function animateStats() {
  const statNumbers = document.querySelectorAll('.stat-item h3');
  
  statNumbers.forEach(stat => {
    const target = parseInt(stat.textContent);
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      stat.textContent = Math.floor(current) + (stat.textContent.includes('%') ? '%' : '+');
    }, 40);
  });
}

// Inicializar contadores cuando las estadísticas son visibles
const statsObserver = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateStats();
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

// Observar la sección de estadísticas
const statsSection = document.querySelector('.stats-section');
if (statsSection) {
  statsObserver.observe(statsSection);
}

document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("darkModeToggle");
    const body = document.body;

    // Cargar preferencia guardada
    if (localStorage.getItem("dark-mode") === "true") {
        body.classList.add("dark-mode");
        toggleBtn.textContent = "☀️";
    }

    // Alternar modo oscuro
    toggleBtn.addEventListener("click", () => {
        body.classList.toggle("dark-mode");

        const isDark = body.classList.contains("dark-mode");
        localStorage.setItem("dark-mode", isDark);

        toggleBtn.textContent = isDark ? "☀️" : "🌙";
    });
});