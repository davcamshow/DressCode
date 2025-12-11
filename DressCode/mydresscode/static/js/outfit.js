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
    updateIcons(newTheme);
  });

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

  // Inicializar sistema de calificación en el modal
  initEstrellasCalificacion();
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

// Sistema de calificación para el modal
function initEstrellasCalificacion() {
  const estrellas = document.querySelectorAll(".estrella");
  const puntuacionMostrada = document.getElementById("puntuacionMostrada");
  let puntuacionSeleccionada = 0;

  estrellas.forEach(estrella => {
    estrella.addEventListener("mouseover", function() {
      const valor = parseInt(this.dataset.value);
      estrellas.forEach((e, index) => {
        if (index < valor) {
          e.classList.add("hover");
        } else {
          e.classList.remove("hover");
        }
      });
    });

    estrella.addEventListener("mouseout", function() {
      estrellas.forEach(e => e.classList.remove("hover"));
      // Restaurar las seleccionadas
      estrellas.forEach((e, index) => {
        if (index < puntuacionSeleccionada) {
          e.classList.add("seleccionada");
        }
      });
    });

    estrella.addEventListener("click", function() {
      puntuacionSeleccionada = parseInt(this.dataset.value);
      puntuacionMostrada.textContent = puntuacionSeleccionada;
      
      // Actualizar visualización de estrellas
      estrellas.forEach((e, index) => {
        if (index < puntuacionSeleccionada) {
          e.classList.add("seleccionada");
        } else {
          e.classList.remove("seleccionada");
        }
      });

      // Guardar calificación si hay un outfit ID
      const idOutfit = document.getElementById("idOutfit").value;
      if (idOutfit) {
        guardarCalificacion(puntuacionSeleccionada, idOutfit);
      }
    });
  });

  // Botón para enviar calificación (alternativo)
  const btnEnviarCalificacion = document.getElementById("enviarCalificacion");
  if (btnEnviarCalificacion) {
    btnEnviarCalificacion.addEventListener("click", function() {
      const idOutfit = document.getElementById("idOutfit").value;
      if (puntuacionSeleccionada > 0 && idOutfit) {
        guardarCalificacion(puntuacionSeleccionada, idOutfit);
        alert("¡Gracias por tu calificación!");
      } else {
        alert("Por favor selecciona una calificación primero.");
      }
    });
  }
}

function guardarCalificacion(rating, outfitId) {
  const idUsuario = document.getElementById("idUsuario").value;
  
  fetch("/guardar-rating/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
    },
    body: JSON.stringify({
      rating: rating,
      idUsuario: idUsuario,
      idOutfit: outfitId
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Calificación guardada:", data);
  })
  .catch(error => {
    console.error("Error al guardar calificación:", error);
  });
}

// Manejo del formulario de guardado
document.getElementById("guardarOutfitForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const form = this;
  const submitBtn = document.getElementById("submitBtn");
  const originalText = submitBtn.textContent;
  
  // Deshabilitar botón y mostrar estado de carga
  submitBtn.textContent = 'Guardando...';
  submitBtn.disabled = true;

  try {
    const formData = new FormData(form);
    
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Guardar el ID del outfit en el campo oculto
      if (data.outfit_id) {
        document.getElementById("idOutfit").value = data.outfit_id;
        
        // Mostrar el modal de guardado exitoso
        mostrarModalGuardado();
      } else {
        alert("Error: No se recibió ID del outfit");
      }
    } else {
      alert("Error al guardar el outfit. Intenta nuevamente.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error de conexión. Intenta nuevamente.");
  } finally {
    // Restaurar botón
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Función para mostrar el modal de guardado
function mostrarModalGuardado() {
  const modal = document.getElementById("guardadoModal");
  modal.style.display = "flex";
  
  // Configurar eventos de los botones del modal
  document.getElementById("btnIrMisOutfits").onclick = function() {
    // Cambia esta URL según tu aplicación
    window.location.href = "/ver-prendas-temp/"; 
  };
  
  document.getElementById("btnIrInicio").onclick = function() {
    window.location.href = "/inicio/"; // URL de inicio
  };
  
  document.getElementById("btnCerrarModal").onclick = function() {
    modal.style.display = "none";
  };
  
  // También cerrar al hacer clic fuera del contenido
  modal.onclick = function(e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };
}

// Inicializar sistema de estrellas del modal
function initEstrellasModal() {
  const estrellas = document.querySelectorAll(".estrella");
  const puntuacionMostrada = document.getElementById("puntuacionMostrada");
  let puntuacionSeleccionada = 0;

  estrellas.forEach(estrella => {
    estrella.addEventListener("mouseover", function() {
      const valor = parseInt(this.dataset.value);
      // Reset all stars
      estrellas.forEach(e => {
        e.classList.remove("seleccionada");
        e.classList.remove("hover");
      });
      // Add hover class to stars up to this one
      for (let i = 0; i < valor; i++) {
        estrellas[i].classList.add("hover");
      }
    });

    estrella.addEventListener("mouseout", function() {
      // Remove hover, restore selected
      estrellas.forEach(e => e.classList.remove("hover"));
      for (let i = 0; i < puntuacionSeleccionada; i++) {
        estrellas[i].classList.add("seleccionada");
      }
    });

    estrella.addEventListener("click", function() {
      puntuacionSeleccionada = parseInt(this.dataset.value);
      puntuacionMostrada.textContent = puntuacionSeleccionada;
      
      // Update stars
      estrellas.forEach((e, index) => {
        e.classList.remove("seleccionada", "hover");
        if (index < puntuacionSeleccionada) {
          e.classList.add("seleccionada");
        }
      });
    });
  });
}

// Llamar a la inicialización cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
  initEstrellasModal();
  
  // También inicializar las estrellas del rating modal existente si hay
  const stars = document.querySelectorAll(".stars span");
  const ratingValue = document.getElementById("ratingValue");

  if (stars.length > 0) {
    stars.forEach(star => {
      star.addEventListener("mouseover", function() {
        stars.forEach(s => s.classList.remove("hover"));
        for (let i = 0; i < this.dataset.value; i++) {
          stars[i].classList.add("hover");
        }
      });

      star.addEventListener("click", function() {
        ratingValue.value = this.dataset.value;
        stars.forEach(s => s.classList.remove("selected"));
        for (let i = 0; i < this.dataset.value; i++) {
          stars[i].classList.add("selected");
        }
      });
    });

    document.querySelector(".stars").addEventListener("mouseleave", function() {
      stars.forEach(s => s.classList.remove("hover"));
      // Restaurar las seleccionadas
      const currentRating = ratingValue.value;
      stars.forEach((s, index) => {
        if (index < currentRating) {
          s.classList.add("selected");
        }
      });
    });
  }
});