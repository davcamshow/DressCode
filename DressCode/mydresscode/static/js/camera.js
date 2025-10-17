// Función auxiliar para obtener el token CSRF de las cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            // Verifica si la cadena de la cookie comienza con el nombre que buscamos
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
    const backgroundColor = type === 'success' ? '#5d9e9e' : '#e06e78';
    
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
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, type === 'success' ? 3000 : 5000);
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
        // Mostrar mensaje de carga
        showMessage('Procesando imagen...', 'info');
        
        // 1. Preparar el envío con FormData
        const formData = new FormData();
        // 'imagen_prenda' DEBE coincidir con la clave que Django espera en request.FILES
        formData.append('imagen_prenda', blob, 'prenda_capturada.png');

        // 2. Configurar la petición
        try {
            const response = await fetch('/subir-prenda/', { 
                method: 'POST',
                body: formData,
                // MUY IMPORTANTE: Incluir el token CSRF
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') 
                }
            });

            const data = await response.json(); // Intentamos parsear la respuesta JSON

            if (response.ok) {
                // Éxito: Django respondió 200 (OK)
                showMessage('✅ Foto procesada, etiquetada y guardada en Supabase.', 'success');
                
                // Redirigir de vuelta a la página principal después de guardar
                setTimeout(() => {
                    window.location.href = INICIO_URL || "{% url 'inicio' %}";
                }, 1500);
            } else {
                // Falla: Django respondió un código de error (400, 401, 500)
                console.error('Error del servidor:', data.error || response.statusText);
                showMessage(`❌ Error al guardar: ${data.error || 'Inténtalo de nuevo.'}`, 'error');
                // Revertir los botones para que el usuario pueda volver a intentarlo
                retakeBtn.click(); 
            }
        } catch (error) {
            console.error('Error de red/conexión:', error);
            showMessage('❌ Error de conexión. Inténtalo de nuevo.', 'error');
            // Revertir los botones
            retakeBtn.click(); 
        }
    }
    
    // Inicializar la cámara
    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Preferir cámara trasera si está disponible
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            video.srcObject = stream;
            
            // Esperar a que el video cargue para obtener sus dimensiones reales
            video.addEventListener('loadedmetadata', function() {
                videoWidth = video.videoWidth;
                videoHeight = video.videoHeight;
                console.log('Dimensiones del video:', videoWidth, 'x', videoHeight);
                
                // Configurar el canvas con las mismas dimensiones del video
                canvas.width = videoWidth;
                canvas.height = videoHeight;
                
                video.style.opacity = '1';
            });
            
        } catch (err) {
            console.error('Error al acceder a la cámara:', err);
            showMessage('No se pudo acceder a la cámara. Por favor, asegúrate de haber otorgado los permisos necesarios.', 'error');
        }
    }
    
    // Capturar foto - VERSIÓN MEJORADA
    captureBtn.addEventListener('click', function() {
        // Efecto visual al capturar
        captureBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            captureBtn.style.transform = '';
        }, 150);
        
        // Obtener las dimensiones reales del video
        const actualVideoWidth = video.videoWidth;
        const actualVideoHeight = video.videoHeight;
        
        // Configurar el canvas con las dimensiones exactas del video
        canvas.width = actualVideoWidth;
        canvas.height = actualVideoHeight;
        
        const context = canvas.getContext('2d');
        
        // Dibujar la imagen completa del video en el canvas
        context.drawImage(video, 0, 0, actualVideoWidth, actualVideoHeight);
        
        // Mostrar vista previa con efecto
        const dataURL = canvas.toDataURL('image/png');
        photoPreview.innerHTML = `<img src="${dataURL}" alt="Foto capturada" style="width: 100%; height: 100%; object-fit: contain;">`;
        photoPreview.style.display = 'block';
        photoPreview.style.opacity = '0';
        
        setTimeout(() => {
            photoPreview.style.opacity = '1';
            video.style.display = 'none';
        }, 10);
        
        // Cambiar visibilidad de botones con transición
        setTimeout(() => {
            captureBtn.style.display = 'none';
            retakeBtn.style.display = 'inline-block';
            saveBtn.style.display = 'inline-block';
            
            // Efecto de aparición para los nuevos botones
            setTimeout(() => {
                retakeBtn.style.opacity = '1';
                saveBtn.style.opacity = '1';
            }, 50);
        }, 300);
    });
    
    // Volver a tomar foto
    retakeBtn.addEventListener('click', function() {
        // Efecto visual
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
            
            // Cambiar visibilidad de botones
            captureBtn.style.display = 'inline-block';
            retakeBtn.style.display = 'none';
            saveBtn.style.display = 'none';
        }, 300);
    });
    
    // Guardar foto - VERSIÓN MEJORADA
    saveBtn.addEventListener('click', function() {
        // Efecto visual
        saveBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            saveBtn.style.transform = '';
        }, 150);
        
        // 1. Obtener la imagen como un objeto Blob (archivo)
        canvas.toBlob(async function(blob) {
            if (!blob) {
                showMessage('Error: No se pudo generar el archivo de imagen.', 'error');
                return;
            }

            // 2. Pasar al siguiente paso: envío con fetch
            await sendImageToDjango(blob);

        }, 'image/png'); // Formato de la imagen: PNG
    });
    
    // Efectos adicionales para mejorar la experiencia
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
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