
// Configuración de Supabase
const SUPABASE_URL = 'https://uovktvztwuzstzbzjafr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdmt0dnp0d3V6c3R6YnpqYWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzY2OTIsImV4cCI6MjA3NTk1MjY5Mn0.ZeelvIIIXAxawn_I-pCF2MX4kct1ldNNKUMZ-t8PtQc';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLE_NAME = 'armario';

// Elementos del DOM
const filterButtons = document.querySelectorAll(".category-filters .filter-btn");
const grid = document.getElementById('photoGrid');
const selectionActions = document.getElementById('selectionActions');
const selectionCount = document.getElementById('selectionCount');
const cancelSelection = document.getElementById('cancelSelection');
const deleteSelection = document.getElementById('deleteSelection');
const searchInput = document.getElementById('wardrobeSearch');
const mensajeExito = document.getElementById('mensajeExito');
const mensajeError = document.getElementById('mensajeError');

// Variables de estado
let selectedItems = [];
let currentFilter = 'Todo';
let allPhotoItems = [];

// Funciones de utilidad
function mostrarMensaje(element) {
  element.classList.remove('hidden');
  element.classList.add('show');
  setTimeout(() => {
    element.classList.remove('show');
    element.classList.add('hidden');
  }, 2500);
}

// Filtrar prendas
function renderWardrobe(filter = 'Todo') {
  currentFilter = filter;
  let visibleCount = 0;

  allPhotoItems.forEach(item => {
    const categoria = item.dataset.categoria || 'prenda';
    const tipo = item.dataset.tipo || '';
    const favorito = item.dataset.favorito === 'true';
    const searchTerm = searchInput.value.toLowerCase();
    
    let show = false;

    // Aplicar filtro de categoría
    switch (filter) {
      case 'Todo': show = true; break;
      case 'Favoritos': show = favorito; break;
      default: show = categoria === filter.toLowerCase() || tipo.toLowerCase().includes(filter.toLowerCase());
    }

    // Aplicar filtro de búsqueda
    if (show && searchTerm) {
      show = tipo.toLowerCase().includes(searchTerm);
    }

    item.style.display = show ? 'block' : 'none';
    if (show) visibleCount++;
  });

  // Actualizar contador de elementos visibles
  const contadorElement = document.querySelector('.item-count');
  if (contadorElement) {
    contadorElement.textContent = `${visibleCount} piezas únicas en tu colección`;
  }
}

// Toggle favorito
function toggleFavorito(prendaId, heartIcon) {
  const nuevoEstado = !heartIcon.classList.contains('active');
  const photoItem = heartIcon.closest('.photo-item');

  supabase
    .from(TABLE_NAME)
    .update({ esFavorito: nuevoEstado })
    .eq('idPrenda', prendaId)
    .then(({ error }) => {
      if (!error) {
        heartIcon.classList.toggle('active');
        photoItem.dataset.favorito = nuevoEstado ? 'true' : 'false';
        if (currentFilter === 'Favoritos') renderWardrobe(currentFilter);
      } else {
        mostrarMensaje(mensajeError);
      }
    });
}

// Actualizar UI de selección
function updateSelectionUI() {
  selectedItems = selectedItems.filter(item => document.body.contains(item));
  if (selectedItems.length > 0) {
    selectionActions.classList.remove('hidden');
    selectionCount.textContent = `${selectedItems.length} seleccionadas`;
  } else {
    selectionActions.classList.add('hidden');
  }
}

// Eliminar prendas seleccionadas
function deleteSelectedPrendas() {
  const ids = selectedItems.map(item => parseInt(item.dataset.id));
  supabase
    .from(TABLE_NAME)
    .delete()
    .in('idPrenda', ids)
    .then(({ error }) => {
      if (!error) {
        selectedItems.forEach(item => item.remove());
        selectedItems = [];
        updateSelectionUI();
        renderWardrobe(currentFilter);
        mostrarMensaje(mensajeExito);
      } else {
        mostrarMensaje(mensajeError);
      }
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  allPhotoItems = Array.from(document.querySelectorAll('.photo-item'));
  renderWardrobe('Todo');
});

// Event Listeners
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderWardrobe(btn.dataset.filter);
  });
});

// Búsqueda en tiempo real
searchInput.addEventListener('input', () => {
  renderWardrobe(currentFilter);
});

// Interacción con el grid
grid.addEventListener('click', (e) => {
  const heartIcon = e.target.closest('.heart');
  if (heartIcon) {
    const prendaId = heartIcon.dataset.prendaId;
    toggleFavorito(prendaId, heartIcon);
    return;
  }

  const photoItem = e.target.closest('.photo-item');
  if (!photoItem) return;

  photoItem.classList.toggle('selected');
  const index = selectedItems.indexOf(photoItem);
  if (photoItem.classList.contains('selected')) {
    if (index === -1) selectedItems.push(photoItem);
  } else {
    if (index !== -1) selectedItems.splice(index, 1);
  }

  updateSelectionUI();
});

// Cancelar selección
cancelSelection.addEventListener('click', () => {
  selectedItems.forEach(item => item.classList.remove('selected'));
  selectedItems = [];
  updateSelectionUI();
});

// Eliminar selección
deleteSelection.addEventListener('click', deleteSelectedPrendas);