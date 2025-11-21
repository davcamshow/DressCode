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
        mostrarToast();
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

  // Puedes enviar la calificación a Django
  fetch("/guardar-rating/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
    },
    body: JSON.stringify({
      rating: selectedRating
    })
  });

  document.getElementById("ratingModal").style.display = "none";
});




