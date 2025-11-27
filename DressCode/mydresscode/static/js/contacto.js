// Script específico para la página Contacto

// Inicialización de la página
document.addEventListener('DOMContentLoaded', function() {
  const contactContainer = document.querySelector('.contact-container');
  
  // Ocultar inicialmente
  contactContainer.style.opacity = '0';
  
  // Luego aplicar transición y mostrar
  setTimeout(() => {
    contactContainer.style.transition = 'opacity 1s ease';
    contactContainer.style.opacity = '1';
    
    // Iniciar fondo dinámico
    initDynamicBackground();
    
    // Configurar navegación del menú
    setupMenuNavigation();
    
    // Configurar formulario
    setupContactForm();
    
    // Iniciar animaciones
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

// Configurar formulario de contacto
function setupContactForm() {
  const contactForm = document.getElementById('contactForm');
  const submitBtn = contactForm.querySelector('.submit-btn');
  
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validar formulario
    if (validateForm()) {
      // Mostrar estado de carga
      submitBtn.classList.add('loading');
      
      // Simular envío (en producción aquí iría tu API)
      setTimeout(() => {
        submitBtn.classList.remove('loading');
        showNotification('¡Mensaje enviado con éxito! Te contactaremos pronto.', 'success');
        contactForm.reset();
      }, 2000);
    }
  });
}

// Validar formulario
function validateForm() {
  const form = document.getElementById('contactForm');
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    // Remover estilos previos
    input.style.borderColor = '';
    
    if (!input.value.trim()) {
      input.style.borderColor = '#e74c3c';
      isValid = false;
      
      // Agregar animación de shake
      input.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        input.style.animation = '';
      }, 500);
    }
  });
  
  // Validar email
  const emailInput = document.getElementById('email');
  if (emailInput.value && !isValidEmail(emailInput.value)) {
    emailInput.style.borderColor = '#e74c3c';
    isValid = false;
    showNotification('Por favor, ingresa un email válido.', 'error');
  }
  
  return isValid;
}

// Validar formato de email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Mostrar notificación
function showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Estilos de la notificación
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 1000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    max-width: 400px;
  `;
  
  // Agregar al documento
  document.body.appendChild(notification);
  
  // Animación de entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Configurar botón de cerrar
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    margin-left: 15px;
  `;
  
  closeBtn.addEventListener('click', () => {
    closeNotification(notification);
  });
  
  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      closeNotification(notification);
    }
  }, 5000);
}

// Cerrar notificación
function closeNotification(notification) {
  notification.style.transform = 'translateX(400px)';
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Animaciones al hacer scroll
function initScrollAnimations() {
  const infoCards = document.querySelectorAll('.info-card');
  const faqItems = document.querySelectorAll('.faq-item');
  const socialCards = document.querySelectorAll('.social-card');
  
  // Configurar Intersection Observer
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
  const elementsToAnimate = [...infoCards, ...faqItems, ...socialCards];
  
  elementsToAnimate.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
  });
}

// Efectos hover mejorados para tarjetas
function enhanceCardHover() {
  const cards = document.querySelectorAll('.info-card, .social-card, .faq-item');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Inicializar efectos hover
document.addEventListener('DOMContentLoaded', enhanceCardHover);

// Animación de shake para inputs
const shakeKeyframes = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

// Agregar keyframes al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = shakeKeyframes;
document.head.appendChild(styleSheet);