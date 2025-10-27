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
    
    resultsDiv.innerHTML = `
        <h2 style="color: #5d9e9e; margin-bottom: 20px;">✅ Prenda Guardada</h2>
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p>La prenda se ha guardado exitosamente en tu armario.</p>
            <p><strong>Complete los detalles manualmente en su armario.</strong></p>
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
        // Redirigir al inicio después de cerrar
        setTimeout(() => {
            window.location.href = INICIO_URL || "/inicio/";
        }, 500);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoPreview = document.getElementById('photo-preview');
    const captureBtn = document.getElementById('capture-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const saveBtn = document.getElementById('save-btn');
    
    let stream = null;
    let videoWidth = 0;
    let videoHeight = 0;

    // Función para enviar el Blob al servidor de Django
    async function sendImageToDjango(blob) {
        showMessage(' Guardando prenda...', 'info');
        
        const formData = new FormData();
        formData.append('imagen_prenda', blob, 'prenda_capturada.png');

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
            } else {
                console.error('Error del servidor:', data.error || response.statusText);
                showMessage(` Error: ${data.error || 'Inténtalo de nuevo.'}`, 'error');
                retakeBtn.click();
            }
        } catch (error) {
            console.error('Error de red/conexión:', error);
            showMessage(' Error de conexión. Inténtalo de nuevo.', 'error');
            retakeBtn.click();
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
            captureBtn.style.display = 'none';
            retakeBtn.style.display = 'inline-block';
            saveBtn.style.display = 'inline-block';
            
            setTimeout(() => {
                retakeBtn.style.opacity = '1';
                saveBtn.style.opacity = '1';
            }, 50);
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
            
            captureBtn.style.display = 'inline-block';
            retakeBtn.style.display = 'none';
            saveBtn.style.display = 'none';
        }, 300);
    });
    
    // Guardar foto
    saveBtn.addEventListener('click', function() {
        saveBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            saveBtn.style.transform = '';
        }, 150);
        
        // Deshabilitar botones durante el procesamiento
        saveBtn.disabled = true;
        retakeBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
        
        canvas.toBlob(async function(blob) {
            if (!blob) {
                showMessage('Error: No se pudo generar el archivo de imagen.', 'error');
                saveBtn.disabled = false;
                retakeBtn.disabled = false;
                saveBtn.textContent = 'Guardar';
                return;
            }

            await sendImageToDjango(blob);

        }, 'image/png');
    });
    
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