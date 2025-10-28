// [file name]: camera.js
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

// Función para mostrar confirmación de guardado
function showSuccessMessage() {
    const resultsDiv = document.createElement('div');
    resultsDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        z-index: 1001;
        max-width: 90%;
        max-height: 80%;
        overflow-y: auto;
        text-align: center;
    `;
    
    // Mostrar detalles de la prenda guardada
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
    
    document.body.appendChild(resultsDiv);
    
    document.getElementById('closeResults').addEventListener('click', function() {
        resultsDiv.remove();
        // Limpiar datos de sessionStorage después del envío exitoso
        sessionStorage.removeItem('prendaData');
        // Redirigir al inicio después de cerrar
        setTimeout(() => {
            window.location.href = INICIO_URL || "/inicio/";
        }, 500);
    });
}

// Función para enviar imagen al servidor
async function sendImageToDjango(blob, filename = 'prenda_capturada.png') {
    showMessage(' Guardando prenda...', 'info');
    
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
            showSuccessMessage();
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

document.addEventListener('DOMContentLoaded', function() {
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