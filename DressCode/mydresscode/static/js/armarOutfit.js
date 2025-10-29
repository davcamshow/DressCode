document.addEventListener('DOMContentLoaded', function() {
  const preview = document.getElementById('outfitPreview');
  const saveBtn = document.getElementById('saveOutfitBtn');
  const outfitName = document.getElementById('outfitName');

  const selected = {
    top: null,
    bottom: null,
    accesorio: null,
    calzado: null
  };

  document.querySelectorAll('.category-grid').forEach(grid => {
    const tipo = grid.id;
    grid.querySelectorAll('.item').forEach(item => {
      item.addEventListener('click', () => {
        grid.querySelectorAll('.item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selected[tipo] = item.dataset.id;
        updatePreview();
      });
    });
  });

  function updatePreview() {
    preview.innerHTML = '';
    Object.keys(selected).forEach(tipo => {
      if (selected[tipo]) {
        const img = document.querySelector(`#${tipo} .item.selected img`).cloneNode();
        img.style.maxWidth = '100px';
        img.style.margin = '10px';
        preview.appendChild(img);
      }
    });
  }

  saveBtn.addEventListener('click', () => {
    const nombre = outfitName.value.trim();
    if (!nombre) {
      alert('Por favor, ingresa un nombre para el outfit.');
      return;
    }

    fetch('/guardar-outfit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify({
        nombre,
        top: selected.top,
        bottom: selected.bottom,
        accesorio: selected.accesorio,
        calzado: selected.calzado
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'ok') {
        showMessage('✨ Outfit guardado exitosamente ✨', 'success');
        outfitName.value = '';
        preview.innerHTML = '';
        document.querySelectorAll('.item').forEach(i => i.classList.remove('selected'));
      } else {
        showMessage(`Error: ${data.message}`, 'error');
      }
    })
    .catch(err => {
      console.error(err);
      showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
    });
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

  function showMessage(msg, type) {
    const div = document.createElement('div');
    div.textContent = msg;
    div.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#5d9e9e' : '#e06e78'};
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: bold;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }
});