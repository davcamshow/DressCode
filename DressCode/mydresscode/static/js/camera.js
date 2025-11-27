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
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    const backgroundColor = type === 'success' ? '#5d9e9e' : 
                           type === 'error' ? '#e06e78' : 
                           type === 'info' ? '#e69c67' : '#5d9e9e';
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${backgroundColor};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: bold;
        text-align: center;
        max-width: 80%;
        white-space: pre-line;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, type === 'success' ? 5000 : type === 'error' ? 5000 : 4000);
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
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;

    const resultsDiv = document.createElement('div');
    resultsDiv.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        z-index: 1001;
        max-width: 95%;
        max-height: 90vh;
        overflow-y: auto;
        text-align: center;
        width: 100%;
        max-width: 900px;
        position: relative;
    `;
    
    // Crear contenido con comparación de imágenes
    const detallesPrenda = prendaData.tipo ? `
        <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; text-align: left; border-left: 4px solid #5d9e9e;">
            <h3 style="color: #5d9e9e; margin-bottom: 15px; font-size: 1.3em;">📋 Detalles de la prenda guardada:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
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
        <h2 style="color: #5d9e9e; margin-bottom: 25px; font-size: 2em; display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span>✅</span> Prenda Guardada - Fondo Removido
        </h2>
        ${detallesPrenda}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin: 30px 0;">
            <div style="text-align: center;">
                <h4 style="color: #666; margin-bottom: 15px; font-size: 1.1em; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>🖼️</span> Imagen Original
                </h4>
                <div style="border: 3px solid #e0e0e0; border-radius: 12px; padding: 10px; background: #f8f9fa;">
                    <img src="${originalImageUrl}" alt="Imagen original" style="width: 100%; max-width: 300px; height: auto; border-radius: 8px;">
                </div>
            </div>
            <div style="text-align: center;">
                <h4 style="color: #5d9e9e; margin-bottom: 15px; font-size: 1.1em; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>🎯</span> Fondo Removido
                </h4>
                <div style="border: 3px solid #5d9e9e; border-radius: 12px; padding: 10px; background: #f0f8f8;">
                    <img src="${segmentedImageUrl}" alt="Imagen sin fondo" style="width: 100%; max-width: 300px; height: auto; border-radius: 8px;">
                </div>
            </div>
        </div>
        
        <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #e8f4f8 0%, #d4edf2 100%); border-radius: 12px; border-left: 4px solid #e69c67;">
            <p style="color: #2c5530; font-weight: bold; font-size: 1.1em; margin-bottom: 8px;">✅ Fondo removido exitosamente</p>
            <p style="color: #666; font-size: 0.95em;">La prenda ha sido aislada mediante inteligencia artificial. El fondo ha sido eliminado para mejores recomendaciones de outfit.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button id="closeResults" style="
                background: linear-gradient(135deg, #5d9e9e 0%, #4a8a8a 100%);
                color: white;
                border: none;
                padding: 15px 35px;
                border-radius: 30px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1.1em;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(93, 158, 158, 0.3);
            ">Continuar al Armario</button>
        </div>
    `;
    
    overlay.appendChild(resultsDiv);
    document.body.appendChild(overlay);
    
    // Agregar efecto hover al botón
    const closeButton = document.getElementById('closeResults');
    closeButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 6px 20px rgba(93, 158, 158, 0.4)';
    });
    
    closeButton.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = '0 4px 15px rgba(93, 158, 158, 0.3)';
    });
    
    closeButton.addEventListener('click', function() {
        overlay.remove();
        // Limpiar datos de sessionStorage después del envío exitoso
        sessionStorage.removeItem('prendaData');
        // Limpiar URL de la imagen original
        if (originalImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(originalImageUrl);
        }
        // Redirigir al inicio después de cerrar
        setTimeout(() => {
            window.location.href = INICIO_URL || "/inicio/";
        }, 500);
    });

    // Cerrar al hacer clic fuera del modal
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
            if (originalImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(originalImageUrl);
            }
            sessionStorage.removeItem('prendaData');
            setTimeout(() => {
                window.location.href = INICIO_URL || "/inicio/";
            }, 500);
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
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;

    const resultsDiv = document.createElement('div');
    resultsDiv.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        z-index: 1001;
        max-width: 500px;
        text-align: center;
        position: relative;
    `;
    
    const originalImageUrl = blob ? URL.createObjectURL(blob) : '';
    const imagePreview = originalImageUrl ? `
        <div style="margin: 20px 0;">
            <img src="${originalImageUrl}" alt="Prenda guardada" style="width: 100%; max-width: 300px; height: auto; border-radius: 12px; border: 3px solid #5d9e9e;">
        </div>
    ` : '';
    
    const detallesPrenda = prendaData.tipo ? `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
            <h3 style="color: #5d9e9e; margin-bottom: 10px;">Detalles de la prenda guardada:</h3>
            <p><strong>Categoría:</strong> ${prendaData.categoria || 'No especificada'}</p>
            <p><strong>Tipo:</strong> ${prendaData.tipo || 'No especificado'}</p>
            <p><strong>Color:</strong> ${prendaData.color || 'No especificado'}</p>
            <p><strong>Temporada:</strong> ${prendaData.temporada || 'Todo el año'}</p>
            <p><strong>Estilo:</strong> ${prendaData.estilo || 'Casual'}</p>
            <p><strong>Favorito:</strong> ${prendaData.esFavorito ? 'Sí' : 'No'}</p>
        </div>
    ` : '';
    
    resultsDiv.innerHTML = `
        <h2 style="color: #5d9e9e; margin-bottom: 20px;">✅ Prenda Guardada</h2>
        ${imagePreview}
        ${detallesPrenda}
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p>La prenda se ha guardado exitosamente en tu armario.</p>
        </div>
        <div style="text-align: center; margin-top: 25px;">
            <button id="closeResults" style="
                background: #5d9e9e;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
            ">Continuar</button>
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
        setTimeout(() => {
            window.location.href = INICIO_URL || "/inicio/";
        }, 500);
    });

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
            if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(originalImageUrl);
            }
            sessionStorage.removeItem('prendaData');
            setTimeout(() => {
                window.location.href = INICIO_URL || "/inicio/";
            }, 500);
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
        infoDiv.style.cssText = `
            background: #f8fdff;
            border: 1px solid #5d9e9e;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: left;
            width: 90%;
            max-width: 500px;
        `;
        infoDiv.innerHTML = `
            <h3 style="color: #5d9e9e; margin-bottom: 10px;">Información de la prenda:</h3>
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