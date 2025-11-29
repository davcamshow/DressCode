
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

const passwordInput = document.getElementById("password");
const reqLength = document.getElementById("req-length");
const reqUppercase = document.getElementById("req-uppercase");
const reqNumber = document.getElementById("req-number");
const reqSpecial = document.getElementById("req-special");

passwordInput.addEventListener("input", function () {
  const password = this.value;
  reqLength.classList.toggle("valid", password.length >= 8);
  reqUppercase.classList.toggle("valid", /[A-Z]/.test(password));
  reqNumber.classList.toggle("valid", /[0-9]/.test(password));
  reqSpecial.classList.toggle(
    "valid",
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  );
});


// Inicializar fondo dinámico
function initDynamicBackground() {
  const canvas = document.getElementById("dynamic-bg");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const particles = [];
  const particleCount = 35;
  const colors = [
    "rgba(107, 68, 35, 0.18)",
    "rgba(139, 114, 92, 0.12)",
    "rgba(169, 144, 122, 0.15)",
  ];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.25 + 0.1,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(
      canvas.width * 0.3,
      canvas.height * 0.6,
      0,
      canvas.width * 0.3,
      canvas.height * 0.6,
      Math.max(canvas.width, canvas.height) * 0.5
    );

    gradient.addColorStop(0, "rgba(245, 240, 232, 0.06)");
    gradient.addColorStop(1, "rgba(201, 176, 154, 0.02)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

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

document.addEventListener("DOMContentLoaded", initDynamicBackground);
