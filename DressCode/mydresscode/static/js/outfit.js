
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

function descartarOutfit() {
  if (confirm("¿Seguro que quieres descartar este outfit?")) {
    document.getElementById("outfitGrid").innerHTML = "";
  }
}

// Cargar opciones dinámicas en listas desplegables
function cargarOpciones(modo, listaId) {
  // Oculta todas las demás listas
  document.querySelectorAll('.dropdown-list').forEach(lista => {
    if (lista.id !== listaId) {
      lista.style.display = 'none';
    }
  });

  const lista = document.getElementById(listaId);

  // Si ya está visible y tiene contenido, no recargues
  if (lista.style.display === 'block' && lista.childElementCount > 0) {
    return;
  }

  // Limpia y muestra la lista actual
  lista.innerHTML = '';

  fetch(`/api/opciones-filtro/?modo=${modo}`)
    .then(res => res.json())
    .then(data => {
      lista.innerHTML = ''; // asegúrate de limpiar antes de llenar
      data.opciones.forEach(op => {
        const li = document.createElement("li");
        li.textContent = op;
        li.onclick = () => {
          window.location.href = `/recomendar-outfit/?modo=${modo}&${modo}=${encodeURIComponent(op)}`;
        };
        lista.appendChild(li);
      });
      lista.style.display = 'block';
    });
}

function ocultarLista(listaId) {
  const lista = document.getElementById(listaId);
  lista.style.display = 'none';
}

document.addEventListener("DOMContentLoaded", function () {
  const stars = document.querySelectorAll(".stars span");
  const ratingValue = document.getElementById("ratingValue");

  stars.forEach(star => {
    star.addEventListener("mouseover", function () {
      stars.forEach(s => s.classList.remove("hover"));
      for (let i = 0; i < this.dataset.value; i++) {
        stars[i].classList.add("hover");
      }
    });

    star.addEventListener("click", function () {
      ratingValue.value = this.dataset.value;
      stars.forEach(s => s.classList.remove("selected"));
      for (let i = 0; i < this.dataset.value; i++) {
        stars[i].classList.add("selected");
      }
    });
  });

  // Quitar hover al salir
  document.querySelector(".stars").addEventListener("mouseleave", function () {
    stars.forEach((star, index) => {
    star.addEventListener("mouseover", function () {
      stars.forEach(s => s.classList.remove("hover"));

      // Pintar SOLO desde donde está el mouse hacia la derecha
      for (let i = index; i < stars.length; i++) {
        stars[i].classList.add("hover");
      }
    });
  });

  });
});


document.getElementById("guardarOutfitForm").addEventListener("submit", async function(e) {
    e.preventDefault(); // 🚫 No recargar la página

    let form = this;
    let url = form.action;

    let formData = new FormData(form);

    // Enviar por AJAX a Django
    let response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    });

    if (response.ok) {
        let data = await response.json();

        // Guardar el ID del outfit recién creado
        document.getElementById("idOutfit").value = data.outfit_id;

        mostrarToast();

        // Mostrar modal de estrellas
        document.getElementById("ratingModal").style.display = "flex";
      } else {
          alert("Error al guardar 😥");
      }
});

function mostrarToast() {
    const toast = document.getElementById("toast-guardado");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

let selectedRating = 0;

document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', function () {
    selectedRating = this.dataset.value;

    document.querySelectorAll('.star').forEach(s => {
      s.classList.remove('selected');
    });

    this.classList.add('selected');
    let previous = this.previousElementSibling;

    while (previous) {
      previous.classList.add('selected');
      previous = previous.previousElementSibling;
    }
  });
});

document.getElementById("enviarRating").addEventListener("click", function () {
  if (selectedRating === 0) {
    alert("Selecciona una calificación primero");
    return;
  }

  let idUsuario = document.getElementById("idUsuario").value;
  let idOutfit = document.getElementById("idOutfit").value;

  fetch("/guardar-rating/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
    },
    body: JSON.stringify({
      rating: selectedRating,
      idUsuario: idUsuario,
      idOutfit: idOutfit
    })
  })
  .then(res => res.json())
  .then(data => {
      console.log(data);
      alert("¡Gracias por tu valoración!");
  });

  document.getElementById("ratingModal").style.display = "none";
});


document.getElementById('guardarOutfitForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    console.log("=== ENVIANDO FORMULARIO ===");
    
    // Verificar qué se está enviando
    const formData = new FormData(this);
    console.log("Datos a enviar:");
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Guardando...';
    submitBtn.disabled = true;
    
    // Enviar con AJAX
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', this.action, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                console.log("Respuesta del servidor:", data);
                
                if (data.success) {
                    alert(`✅ ¡Outfit guardado!\nID: ${data.outfit_id}\nPrendas: ${data.total_prendas}`);
                    // Redirigir a recomendaciones
                    window.location.href = "{% url 'outfits_recommendations' %}";
                } else {
                    alert('❌ Error: ' + data.error);
                }
            } catch (e) {
                alert('✅ ¡Outfit guardado! Redirigiendo...');
                window.location.href = "{% url 'outfits_recommendations' %}";
            }
        } else {
            alert('❌ Error del servidor: ' + xhr.status);
        }
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    };
    
    xhr.onerror = function() {
        alert('❌ Error de conexión');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    };
    
    xhr.send(formData);
});






