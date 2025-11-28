document.querySelector(".btn-continue").addEventListener("click", function () {
  window.location.href = "{% url 'login' %}";
});

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }
});
