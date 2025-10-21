const filterButtons = document.querySelectorAll(".filters button");
const grid = document.getElementById('photoGrid');
const selectionActions = document.getElementById('selectionActions');
const selectionCount = document.getElementById('selectionCount');
const cancelSelection = document.getElementById('cancelSelection');
const deleteSelection = document.getElementById('deleteSelection');


filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    //aqui para filtrar
  });
});


// Activar corazones (favoritos)
grid.addEventListener('click', (e) => {
  if (e.target.classList.contains('heart')) {
    e.target.classList.toggle('active');
    //aquí para agregar el cambio de fav es verddadero cuando se presiona el corazon 
  }
});

let selectedItems = [];

grid.addEventListener('click', (e) => {
  const photoItem = e.target.closest('.photo-item');
  if (!photoItem || e.target.classList.contains('heart')) return;

  photoItem.classList.toggle('selected');

  const index = selectedItems.indexOf(photoItem);
  if (photoItem.classList.contains('selected')) {
    if (index === -1) selectedItems.push(photoItem);
  } else {
    if (index !== -1) selectedItems.splice(index, 1);
  }

  updateSelectionUI();
});

function updateSelectionUI() {
  if (selectedItems.length > 0) {
    selectionActions.classList.remove('hidden');
    selectionCount.textContent = `${selectedItems.length} seleccionadas`;
  } else {
    selectionActions.classList.add('hidden');
  }
}

cancelSelection.addEventListener('click', () => {
  selectedItems.forEach(item => item.classList.remove('selected'));
  selectedItems = [];
  updateSelectionUI();
});


function getCSRFToken() {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return value;
  }
  return '';
}

const mensajeExito = document.getElementById('mensajeExito');
const mensajeError = document.getElementById('mensajeError');

function mostrarMensajeExito() {
  mensajeExito.classList.remove('hidden');
  mensajeExito.classList.add('show');
  setTimeout(() => {
    mensajeExito.classList.remove('show');
    mensajeExito.classList.add('hidden');
  }, 2500);
}

function mostrarMensajeError() {
  mensajeError.classList.remove('hidden');
  mensajeError.classList.add('show');
  setTimeout(() => {
    mensajeError.classList.remove('show');
    mensajeError.classList.add('hidden');
  }, 2500);
}

deleteSelection.addEventListener('click', () => {
  const ids = selectedItems.map(item => item.dataset.id);

  if (ids.length === 0) return;

  fetch('/eliminar-prendas/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken()
    },
    body: JSON.stringify({ ids })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'ok') {
      selectedItems.forEach(item => item.remove());
      selectedItems = [];
      updateSelectionUI();
      mostrarMensajeExito();
    } else {
      mostrarMensajeError();
    }
  })
  .catch(err => {
    console.error('Error en la petición:', err);
    mostrarMensajeError();
  });
});