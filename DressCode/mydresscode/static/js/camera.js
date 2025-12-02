
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

// [file name]: camera.js

// =============================================
// FUNCIÓN PARA CARGAR FOTO DE PERFIL
// =============================================
function loadProfilePhoto() {
    const profileIcon = document.querySelector('.profile-icon');
    if (!profileIcon) {
        console.log('No se encontró el elemento profile-icon');
        return;
    }
    
    const savedImage = localStorage.getItem('profileImage');
    const hasProfileImage = localStorage.getItem('hasProfileImage');
    
    console.log('Cargando foto de perfil:', { savedImage: !!savedImage, hasProfileImage });
    
    if (hasProfileImage === 'true' && savedImage) {
        // Si hay foto guardada, mostrarla
        profileIcon.innerHTML = `<img src="${savedImage}" alt="Foto de perfil">`;
        console.log('Foto de perfil cargada desde localStorage');
    } else {
        // Si no hay foto, mostrar el icono por defecto
        profileIcon.innerHTML = '<i class="fas fa-user default-icon"></i>';
        console.log('Usando icono por defecto para perfil');
    }
}

// =============================================
// FUNCIONALIDAD DEL DROPDOWN DE PERFIL
// =============================================
function initProfileDropdown() {
    const profileContainer = document.querySelector('.profile-container');
    const profileIcon = document.querySelector('.profile-icon');
    
    if (!profileContainer || !profileIcon) {
        console.log('No se encontraron elementos del dropdown de perfil');
        return;
    }
    
    console.log('Inicializando dropdown de perfil');
    
    // Abrir/cerrar dropdown
    profileIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        profileContainer.classList.toggle('active');
        console.log('Dropdown de perfil toggled');
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (profileContainer && !profileContainer.contains(e.target)) {
            profileContainer.classList.remove('active');
        }
    });
}

// =============================================
// CÓDIGO ORIGINAL DE LA CÁMARA
// =============================================

// Función auxiliar para obtener el token CSRF de las cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Recuperar datos del formulario de categoría
const prendaData = JSON.parse(sessionStorage.getItem('prendaData') || '{}');

// Función para mostrar mensajes al usuario
// showMessage -> usa clases en lugar de estilos inline
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('toast');
    // clase por tipo
    if (type === 'success') messageDiv.classList.add('toast--success');
    else if (type === 'error') messageDiv.classList.add('toast--error');
    else messageDiv.classList.add('toast--info');

    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // animación de entrada (opcional)
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(-6px)';
    requestAnimationFrame(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    });

    const timeout = (type === 'success' || type === 'error') ? 5000 : 4000;
    setTimeout(() => {
        // animación de salida
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(-8px)';
        setTimeout(() => messageDiv.remove(), 250);
    }, timeout);
}


// Función para aplicar segmentación a la imagen
async function applySegmentation(blob, prendaId = null) {
    try {
        showMessage(' Removiendo fondo de la imagen...', 'info');
        
        // Crear FormData para enviar la imagen
        const formData = new FormData();
        formData.append('imagen', blob, 'prenda_para_segmentar.png');
        
        // ✅ ENVIAR EL ID DE LA PRENDA SI ESTÁ DISPONIBLE
        if (prendaId) {
            formData.append('prenda_id', prendaId);
        }
        
        // Enviar la imagen al servidor para segmentación
        const response = await fetch(SEGMENTAR_URL || '/segmentar-prenda/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.segmented_image) {
                showMessage(' Fondo removido exitosamente', 'success');
                return result;
            } else {
                throw new Error(result.error || 'Error al remover el fondo');
            }
        } else {
            throw new Error('Error del servidor: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error al remover el fondo:', error);
        showMessage(' No se pudo remover el fondo. Mostrando imagen original.', 'error');
        return null;
    }
}

// Función para mostrar resultados de segmentación
function showSegmentationResults(originalImageUrl, segmentedImageUrl, prendaData) {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    const resultsDiv = document.createElement('div');
    resultsDiv.classList.add('modal-content');

    // construir contenido sin estilos en línea pesados (usar clases)
    const detallesPrenda = prendaData.tipo ? `
        <div class="prenda-detalles">
            <h3 style="color: var(--accent-teal); margin-bottom:8px;">📋 Detalles de la prenda guardada:</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <p><strong>🏷️ Categoría:</strong> ${prendaData.categoria || 'No especificada'}</p>
                <p><strong>👕 Tipo:</strong> ${prendaData.tipo || 'No especificado'}</p>
                <p><strong>🎨 Color:</strong> ${prendaData.color || 'No especificado'}</p>
                <p><strong>🌤️ Temporada:</strong> ${prendaData.temporada || 'Todo el año'}</p>
                <p><strong>👔 Estilo:</strong> ${prendaData.estilo || 'Casual'}</p>
                <p><strong>⭐ Favorito:</strong> ${prendaData.esFavorito ? 'Sí' : 'No'}</p>
            </div>
        </div>
    ` : '';

    resultsDiv.innerHTML = `
        <div class="modal-title"><span>✅</span> <strong>Prenda Guardada - Fondo Removido</strong></div>
        ${detallesPrenda}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:18px 0;">
            <div style="text-align:center;">
                <h4 class="muted" style="margin-bottom:10px;"><span>🖼️</span> Imagen Original</h4>
                <div class="image-box">
                    <img src="${originalImageUrl}" alt="Imagen original" style="width:100%; max-width:300px; height:auto; border-radius:8px;">
                </div>
            </div>
            <div style="text-align:center;">
                <h4 style="color: var(--accent-teal); margin-bottom:10px;"><span>🎯</span> Fondo Removido</h4>
                <div class="image-box" style="border-color: var(--accent-teal);">
                    <img src="${segmentedImageUrl}" alt="Imagen sin fondo" style="width:100%; max-width:300px; height:auto; border-radius:8px;">
                </div>
            </div>
        </div>
        <div class="prenda-detalles" style="border-left-color: var(--accent-orange);">
            <p style="font-weight:700; color: var(--muted-text);">✅ Fondo removido exitosamente</p>
            <p class="muted">La prenda ha sido aislada mediante inteligencia artificial. El fondo ha sido eliminado para mejores recomendaciones de outfit.</p>
        </div>
        <div style="text-align:center; margin-top:18px;">
            <button id="closeResults" class="btn-primary">Continuar al Armario</button>
        </div>
    `;

    overlay.appendChild(resultsDiv);
    document.body.appendChild(overlay);

    const closeButton = document.getElementById('closeResults');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            overlay.remove();
            sessionStorage.removeItem('prendaData');
            if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(originalImageUrl);
            }
            setTimeout(() => window.location.href = INICIO_URL || "/inicio/", 500);
        });
    }

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
            if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(originalImageUrl);
            }
            sessionStorage.removeItem('prendaData');
            setTimeout(() => window.location.href = INICIO_URL || "/inicio/", 500);
        }
    });
}


// Función para enviar imagen al servidor
async function sendImageToDjango(blob, filename = 'prenda_capturada.png') {
    showMessage(' Procesando y guardando prenda...', 'info');
    
    const formData = new FormData();
    formData.append('imagen_prenda', blob, filename);
    
    // Agregar datos del formulario si existen
    if (prendaData.categoria) {
        formData.append('categoria', prendaData.categoria);
    }
    if (prendaData.tipo) {
        formData.append('tipo', prendaData.tipo);
    }
    if (prendaData.color) {
        formData.append('color', prendaData.color);
    }
    if (prendaData.temporada) {
        formData.append('temporada', prendaData.temporada);
    }
    if (prendaData.estilo) {
        formData.append('estilo', prendaData.estilo);
    }
    if (prendaData.esFavorito !== undefined) {
        formData.append('esFavorito', prendaData.esFavorito);
    }

    try {
        const response = await fetch('/subir-prenda/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Aplicar segmentación después de guardar la prenda
            showMessage(' Removiendo fondo...', 'info');
            const segmentationResult = await applySegmentation(blob, data.prenda_id);
            
            if (segmentationResult && segmentationResult.segmented_image) {
                // Mostrar resultados con ambas imágenes
                const originalImageUrl = URL.createObjectURL(blob);
                showSegmentationResults(originalImageUrl, segmentationResult.segmented_image, prendaData);
            } else {
                // Fallback: mostrar mensaje normal si falla la segmentación
                showSuccessMessage(blob);
            }
            return true;
        } else {
            console.error('Error del servidor:', data.error || response.statusText);
            showMessage(` Error: ${data.error || 'Inténtalo de nuevo.'}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error de red/conexión:', error);
        showMessage(' Error de conexión. Inténtalo de nuevo.', 'error');
        return false;
    }
}

// Función de fallback si la segmentación no está disponible
function showSuccessMessage(blob) {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');

    const resultsDiv = document.createElement('div');
    resultsDiv.classList.add('modal-content');

    const originalImageUrl = blob ? URL.createObjectURL(blob) : '';
    const imagePreview = originalImageUrl ? `
        <div style="margin: 16px 0;">
            <img src="${originalImageUrl}" alt="Prenda guardada" style="width:100%; max-width:300px; height:auto; border-radius:12px; border:3px solid var(--accent-teal);">
        </div>
    ` : '';

    const detallesPrenda = prendaData.tipo ? `
        <div class="prenda-detalles">
            <h3 style="color: var(--accent-teal); margin-bottom:8px;">Detalles de la prenda guardada:</h3>
            <p><strong>Categoría:</strong> ${prendaData.categoria || 'No especificada'}</p>
            <p><strong>Tipo:</strong> ${prendaData.tipo || 'No especificado'}</p>
            <p><strong>Color:</strong> ${prendaData.color || 'No especificado'}</p>
            <p><strong>Temporada:</strong> ${prendaData.temporada || 'Todo el año'}</p>
            <p><strong>Estilo:</strong> ${prendaData.estilo || 'Casual'}</p>
            <p><strong>Favorito:</strong> ${prendaData.esFavorito ? 'Sí' : 'No'}</p>
        </div>
    ` : '';

    resultsDiv.innerHTML = `
        <div class="modal-title">✅ <strong>Prenda Guardada</strong></div>
        ${imagePreview}
        ${detallesPrenda}
        <div style="margin-top:12px; padding:12px; border-radius:8px; background: linear-gradient(135deg, var(--card-gradient-start), var(--card-gradient-end));">
            <p>La prenda se ha guardado exitosamente en tu armario.</p>
        </div>
        <div style="text-align:center; margin-top:16px;">
            <button id="closeResults" class="btn-primary">Continuar</button>
        </div>
    `;

    overlay.appendChild(resultsDiv);
    document.body.appendChild(overlay);

    document.getElementById('closeResults').addEventListener('click', function() {
        overlay.remove();
        if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(originalImageUrl);
        }
        sessionStorage.removeItem('prendaData');
        setTimeout(() => window.location.href = INICIO_URL || "/inicio/", 500);
    });

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
            if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(originalImageUrl);
            }
            sessionStorage.removeItem('prendaData');
            setTimeout(() => window.location.href = INICIO_URL || "/inicio/", 500);
        }
    });
}

// =============================================
// INICIALIZACIÓN PRINCIPAL
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando cámara y perfil');
    
    // =============================================
    // INICIALIZAR FOTO DE PERFIL (NUEVO)
    // =============================================
    loadProfilePhoto();
    initProfileDropdown();
    
    // =============================================
    // CÓDIGO ORIGINAL DE LA CÁMARA
    // =============================================
    
    // Elementos de la cámara
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoPreview = document.getElementById('photo-preview');
    
    // Elementos de subida de archivos
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    
    // Contenedores
    const cameraContainer = document.getElementById('camera-container');
    const uploadContainer = document.getElementById('upload-container');
    
    // Botones de opción
    const cameraOption = document.getElementById('camera-option');
    const uploadOption = document.getElementById('upload-option');
    
    // Botones de control
    const captureBtn = document.getElementById('capture-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const changeFileBtn = document.getElementById('change-file-btn');
    const saveBtn = document.getElementById('save-btn');
    
    // Instrucciones
    const cameraInstructions = document.getElementById('camera-instructions');
    const uploadInstructions = document.getElementById('upload-instructions');
    
    let stream = null;
    let videoWidth = 0;
    let videoHeight = 0;
    let currentMode = 'camera'; // 'camera' o 'upload'
    let selectedFile = null;

    // Mostrar información de la prenda si existe
    if (prendaData.tipo) {
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('prenda-info');

        infoDiv.innerHTML = `
            <h3>Información de la prenda:</h3>
            <p><strong>Categoría:</strong> ${prendaData.categoria}</p>
            <p><strong>Tipo:</strong> ${prendaData.tipo}</p>
            <p><strong>Color:</strong> ${prendaData.color}</p>
            <p><strong>Temporada:</strong> ${prendaData.temporada}</p>
            <p><strong>Estilo:</strong> ${prendaData.estilo}</p>
            <p><strong>Favorito:</strong> ${prendaData.esFavorito ? 'Sí' : 'No'}</p>
        `;


        
        // Insertar antes del título principal
        const mainContent = document.querySelector('.main-content');
        const title = document.querySelector('.title');
        mainContent.insertBefore(infoDiv, title);
    }

    // Cambiar entre modos
    cameraOption.addEventListener('click', function() {
        switchMode('camera');
    });

    uploadOption.addEventListener('click', function() {
        switchMode('upload');
    });

    function switchMode(mode) {
        currentMode = mode;
        
        // Actualizar botones activos
        cameraOption.classList.toggle('active', mode === 'camera');
        uploadOption.classList.toggle('active', mode === 'upload');
        
        // Mostrar/ocultar contenedores
        cameraContainer.style.display = mode === 'camera' ? 'flex' : 'none';
        uploadContainer.style.display = mode === 'upload' ? 'flex' : 'none';
        
        // Mostrar/ocultar instrucciones
        cameraInstructions.style.display = mode === 'camera' ? 'block' : 'none';
        uploadInstructions.style.display = mode === 'upload' ? 'block' : 'none';
        
        // Resetear estados
        resetCameraState();
        resetUploadState();
        
        // Actualizar botones de control
        updateControlButtons();
        
        // Inicializar cámara si es necesario
        if (mode === 'camera' && !stream) {
            initCamera();
        }
    }

    function resetCameraState() {
        photoPreview.style.display = 'none';
        video.style.display = 'block';
        if (stream) {
            video.style.opacity = '1';
        }
    }

    function resetUploadState() {
        filePreview.style.display = 'none';
        uploadArea.style.display = 'flex';
        selectedFile = null;
    }

    function updateControlButtons() {
        if (currentMode === 'camera') {
            captureBtn.style.display = 'inline-block';
            uploadBtn.style.display = 'none';
            
            if (photoPreview.style.display === 'block') {
                retakeBtn.style.display = 'inline-block';
                saveBtn.style.display = 'inline-block';
                captureBtn.style.display = 'none';
            } else {
                retakeBtn.style.display = 'none';
                saveBtn.style.display = 'none';
            }
            changeFileBtn.style.display = 'none';
        } else {
            captureBtn.style.display = 'none';
            uploadBtn.style.display = 'inline-block';
            
            if (selectedFile) {
                changeFileBtn.style.display = 'inline-block';
                saveBtn.style.display = 'inline-block';
                uploadBtn.style.display = 'none';
            } else {
                changeFileBtn.style.display = 'none';
                saveBtn.style.display = 'none';
            }
            retakeBtn.style.display = 'none';
        }
    }

    // Inicializar la cámara
    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            video.srcObject = stream;
            
            video.addEventListener('loadedmetadata', function() {
                videoWidth = video.videoWidth;
                videoHeight = video.videoHeight;
                console.log('Dimensiones del video:', videoWidth, 'x', videoHeight);
                
                canvas.width = videoWidth;
                canvas.height = videoHeight;
                
                video.style.opacity = '1';
            });
            
        } catch (err) {
            console.error('Error al acceder a la cámara:', err);
            showMessage('No se pudo acceder a la cámara. Por favor, asegúrate de haber otorgado los permisos necesarios.', 'error');
        }
    }
    
    // Capturar foto
    captureBtn.addEventListener('click', function() {
        captureBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            captureBtn.style.transform = '';
        }, 150);
        
        const actualVideoWidth = video.videoWidth;
        const actualVideoHeight = video.videoHeight;
        
        canvas.width = actualVideoWidth;
        canvas.height = actualVideoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, actualVideoWidth, actualVideoHeight);
        
        const dataURL = canvas.toDataURL('image/png');
        photoPreview.innerHTML = `<img src="${dataURL}" alt="Foto capturada" style="width: 100%; height: 100%; object-fit: contain;">`;
        photoPreview.style.display = 'block';
        photoPreview.style.opacity = '0';
        
        setTimeout(() => {
            photoPreview.style.opacity = '1';
            video.style.display = 'none';
        }, 10);
        
        setTimeout(() => {
            updateControlButtons();
        }, 300);
    });
    
    // Volver a tomar foto
    retakeBtn.addEventListener('click', function() {
        retakeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            retakeBtn.style.transform = '';
        }, 150);
        
        photoPreview.style.opacity = '0';
        
        setTimeout(() => {
            photoPreview.style.display = 'none';
            video.style.display = 'block';
            
            setTimeout(() => {
                video.style.opacity = '1';
            }, 50);
            
            updateControlButtons();
        }, 300);
    });
    
    // Subir archivo
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Cambiar archivo
    changeFileBtn.addEventListener('click', function() {
        resetUploadState();
        updateControlButtons();
    });
    
    // Manejar selección de archivo
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    function handleFileSelect(file) {
        // Validar tipo de archivo
        if (!file.type.match('image.*')) {
            showMessage('Por favor, selecciona un archivo de imagen válido.', 'error');
            return;
        }
        
        // Validar tamaño (10MB máximo)
        if (file.size > 10 * 1024 * 1024) {
            showMessage('El archivo es demasiado grande. Máximo 10MB.', 'error');
            return;
        }
        
        selectedFile = file;
        
        // Mostrar previsualización
        const reader = new FileReader();
        reader.onload = function(e) {
            filePreview.innerHTML = `<img src="${e.target.result}" alt="Previsualización" style="width: 100%; height: 100%; object-fit: contain;">`;
            filePreview.style.display = 'flex';
            uploadArea.style.display = 'none';
            updateControlButtons();
        };
        reader.readAsDataURL(file);
    }
    
    // Guardar prenda
    saveBtn.addEventListener('click', async function() {
        saveBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            saveBtn.style.transform = '';
        }, 150);
        
        // Deshabilitar botones durante el procesamiento
        saveBtn.disabled = true;
        if (currentMode === 'camera') {
            retakeBtn.disabled = true;
            saveBtn.textContent = 'Guardando...';
        } else {
            changeFileBtn.disabled = true;
            saveBtn.textContent = 'Subiendo...';
        }
        
        let success = false;
        
        if (currentMode === 'camera') {
            // Guardar desde cámara
            canvas.toBlob(async function(blob) {
                if (!blob) {
                    showMessage('Error: No se pudo generar el archivo de imagen.', 'error');
                    resetSaveButton();
                    return;
                }
                success = await sendImageToDjango(blob);
                if (!success) {
                    resetSaveButton();
                }
            }, 'image/png');
        } else {
            // Guardar desde archivo
            success = await sendImageToDjango(selectedFile, selectedFile.name);
            if (!success) {
                resetSaveButton();
            }
        }
    });
    
    function resetSaveButton() {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Prenda';
        if (currentMode === 'camera') {
            retakeBtn.disabled = false;
        } else {
            changeFileBtn.disabled = false;
        }
    }
    
    // Efectos adicionales
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(-2px)';
            }
        });
        
        button.addEventListener('mouseleave', function() {
            if (!this.disabled) {
                this.style.transform = '';
            }
        });
    });
    
    // Inicializar la cámara cuando se carga la página
    initCamera();
    
    // Detener la cámara cuando se abandona la página
    window.addEventListener('beforeunload', function() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
});

const body = document.body;
    const toggleBtn = document.getElementById("theme-toggle");

    toggleBtn.addEventListener("click", () => {
        body.dataset.theme = body.dataset.theme === "dark" ? "light" : "dark";
    });
