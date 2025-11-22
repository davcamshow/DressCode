// Textos que se mostrarán con efecto de escritura
const titleText = "Bienvenido a DressCode";
const subtitleText = "Potencia tu estilo";
const descriptionText = "Gestiona tu guardarropa y crea outfits perfectos en base a tus gustos, adentrate en el mundo de la moda con nosotros.";

// Efecto de aparición suave al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  const textSection = document.querySelector('.text-section');
  const carouselContainer = document.querySelector('.carousel-container');
  const buttonsContainer = document.getElementById('buttons-container');
  
  textSection.style.opacity = '0';
  carouselContainer.style.opacity = '0';
  
  setTimeout(() => {
    textSection.style.transition = 'opacity 1s ease';
    carouselContainer.style.transition = 'opacity 1s ease 0.3s';
    textSection.style.opacity = '1';
    carouselContainer.style.opacity = '1';
    
    // Iniciar efecto de escritura
    startTypingEffect();
    
    // Iniciar carrusel
    initCarousel();
    
    // Iniciar fondo dinámico
    initDynamicBackground();
    
    // Configurar navegación de botones
    setupButtonNavigation();
  }, 300);
});

// Configurar navegación de botones
function setupButtonNavigation() {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  
  // Redirigir a la página de login
  loginBtn.addEventListener('click', function() {
    // Aquí puedes cambiar la URL por la ruta correcta de tu aplicación
    window.location.href = '/login';  // o la ruta que uses para login
  });
  
  // Redirigir a la página de registro
  registerBtn.addEventListener('click', function() {
    // Aquí puedes cambiar la URL por la ruta correcta de tu aplicación
    window.location.href = '/register';  // o la ruta que uses para registro
  });
}

// Función para el efecto de escritura
function startTypingEffect() {
  const titleElement = document.getElementById('typing-title');
  const subtitleElement = document.getElementById('typing-subtitle');
  const descriptionElement = document.getElementById('typing-description');
  const buttonsContainer = document.getElementById('buttons-container');
  
  let titleIndex = 0;
  let subtitleIndex = 0;
  let descriptionIndex = 0;
  
  // Escribir título
  function typeTitle() {
    if (titleIndex < titleText.length) {
      titleElement.innerHTML = titleText.substring(0, titleIndex + 1) + '<span class="typing-cursor"></span>';
      titleIndex++;
      setTimeout(typeTitle, 60); // REDUCIDO de 100ms a 60ms
    } else {
      // Quitar cursor del título y comenzar subtítulo
      titleElement.innerHTML = titleText;
      setTimeout(typeSubtitle, 300); // REDUCIDO de 500ms a 300ms
    }
  }
  
  // Escribir subtítulo
  function typeSubtitle() {
    if (subtitleIndex < subtitleText.length) {
      subtitleElement.innerHTML = subtitleText.substring(0, subtitleIndex + 1) + '<span class="typing-cursor"></span>';
      subtitleIndex++;
      setTimeout(typeSubtitle, 50); // REDUCIDO de 80ms a 50ms
    } else {
      // Quitar cursor del subtítulo y comenzar descripción
      subtitleElement.innerHTML = subtitleText;
      setTimeout(typeDescription, 300); // REDUCIDO de 500ms a 300ms
    }
  }
  
  // Escribir descripción
  function typeDescription() {
    if (descriptionIndex < descriptionText.length) {
      descriptionElement.innerHTML = descriptionText.substring(0, descriptionIndex + 1) + '<span class="typing-cursor"></span>';
      descriptionIndex++;
      setTimeout(typeDescription, 30); // REDUCIDO de 40ms a 30ms
    } else {
      // Quitar cursor y mostrar botones
      descriptionElement.innerHTML = descriptionText;
      setTimeout(showButtons, 300); // REDUCIDO de 500ms a 300ms
    }
  }
  
  // Mostrar botones después de que termine la escritura
  function showButtons() {
    buttonsContainer.style.opacity = '1';
  }
  
  // Iniciar el efecto
  typeTitle();
}

// Función para inicializar el carrusel
function initCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.carousel-indicator');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  
  let currentSlide = 0;
  let slideInterval;
  
  // Función para mostrar una diapositiva específica
  function showSlide(index) {
    // Remover clase activa de todas las diapositivas e indicadores
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Asegurarse de que el índice esté dentro de los límites
    if (index >= slides.length) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = slides.length - 1;
    } else {
      currentSlide = index;
    }
    
    // Agregar clase activa a la diapositiva e indicador actual
    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
  }
  
  // Función para avanzar a la siguiente diapositiva
  function nextSlide() {
    showSlide(currentSlide + 1);
  }
  
  // Función para retroceder a la diapositiva anterior
  function prevSlide() {
    showSlide(currentSlide - 1);
  }
  
  // Iniciar el cambio automático de diapositivas
  function startSlideShow() {
    slideInterval = setInterval(nextSlide, 5000);
  }
  
  // Detener el cambio automático de diapositivas
  function stopSlideShow() {
    clearInterval(slideInterval);
  }
  
  // Event listeners para los botones de navegación
  prevBtn.addEventListener('click', () => {
    stopSlideShow();
    prevSlide();
    startSlideShow();
  });
  
  nextBtn.addEventListener('click', () => {
    stopSlideShow();
    nextSlide();
    startSlideShow();
  });
  
  // Event listeners para los indicadores
  indicators.forEach(indicator => {
    indicator.addEventListener('click', () => {
      const index = parseInt(indicator.getAttribute('data-index'));
      stopSlideShow();
      showSlide(index);
      startSlideShow();
    });
  });
  
  // Pausar el carrusel cuando el mouse está sobre él
  const carousel = document.querySelector('.carousel-container');
  carousel.addEventListener('mouseenter', stopSlideShow);
  carousel.addEventListener('mouseleave', startSlideShow);
  
  // Iniciar el carrusel
  startSlideShow();
}

// Función para inicializar el fondo dinámico
function initDynamicBackground() {
  const canvas = document.getElementById('dynamic-bg');
  const ctx = canvas.getContext('2d');
  
  // Ajustar tamaño del canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Configuración de partículas
  const particles = [];
  const particleCount = 80;
  const colors = [
    'rgba(107, 68, 35, 0.3)',
    'rgba(139, 114, 92, 0.2)',
    'rgba(169, 144, 122, 0.25)',
    'rgba(201, 176, 154, 0.2)',
    'rgba(221, 209, 196, 0.15)'
  ];
  
  // Crear partículas
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.2
    });
  }
  
  // Función de animación
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar gradiente animado
    const gradient = ctx.createRadialGradient(
      canvas.width * 0.3,
      canvas.height * 0.7,
      0,
      canvas.width * 0.3,
      canvas.height * 0.7,
      Math.max(canvas.width, canvas.height) * 0.8
    );
    
    const time = Date.now() * 0.001;
    const pulse = Math.sin(time) * 0.1 + 0.9;
    
    gradient.addColorStop(0, `rgba(245, 240, 232, ${0.1 * pulse})`);
    gradient.addColorStop(0.5, `rgba(221, 209, 196, ${0.05 * pulse})`);
    gradient.addColorStop(1, `rgba(201, 176, 154, ${0.02 * pulse})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Actualizar y dibujar partículas
    particles.forEach(particle => {
      // Movimiento
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Rebote en los bordes
      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      
      // Dibujar partícula
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();
    });
    
    // Dibujar ondas sutiles
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 3; i++) {
      const waveOffset = time * 0.5 + i * 2;
      const amplitude = 50 + i * 20;
      
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.7);
      
      for (let x = 0; x < canvas.width; x += 10) {
        const y = canvas.height * 0.7 + Math.sin(x * 0.01 + waveOffset) * amplitude;
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = `rgba(107, 68, 35, ${0.3 - i * 0.1})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    requestAnimationFrame(animate);
  }
  
  animate();
}