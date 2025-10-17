
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



document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoPreview = document.getElementById('photo-preview');
    const captureBtn = document.getElementById('capture-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const saveBtn = document.getElementById('save-btn');
    
    let stream = null;


    // Función para enviar el Blob al servidor de Django
    async function sendImageToDjango(blob) {
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
                window.location.href = INICIO_URL;

                // Éxito: Django respondió 200 (OK)
                alert('✅ Foto procesada, etiquetada y guardada en Supabase.');
                // Redirigir de vuelta a la página principal después de guardar
                window.location.href = "{% url 'inicio' %}";
            } else {
                // Falla: Django respondió un código de error (400, 401, 500)
                console.error('Error del servidor:', data.error || response.statusText);
                alert(`❌ Error al guardar: ${data.error || 'Inténtalo de nuevo.'}`);
                // Revertir los botones para que el usuario pueda volver a intentarlo
                retakeBtn.click(); 
            }
        } catch (error) {
            console.error('Error de red/conexión:', error);
            alert('❌ Error de conexión. Inténtalo de nuevo.');
            // Revertir los botones
            retakeBtn.click(); 
        }
    }
    
    // ... (Asegúrate de que la función getCookie esté también en tu JS) ...
    
    // Inicializar la cámara
    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Preferir cámara trasera si está disponible
                } 
            });
            video.srcObject = stream;
        } catch (err) {
            console.error('Error al acceder a la cámara:', err);
            alert('No se pudo acceder a la cámara. Por favor, asegúrate de haber otorgado los permisos necesarios.');
        }
    }
    
    // Capturar foto
    captureBtn.addEventListener('click', function() {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Mostrar vista previa
        const dataURL = canvas.toDataURL('image/png');
        photoPreview.innerHTML = `<img src="${dataURL}" alt="Foto capturada">`;
        photoPreview.style.display = 'block';
        video.style.display = 'none';
        
        // Cambiar visibilidad de botones
        captureBtn.style.display = 'none';
        retakeBtn.style.display = 'inline-block';
        saveBtn.style.display = 'inline-block';
    });
    
    // Volver a tomar foto
    retakeBtn.addEventListener('click', function() {
        photoPreview.style.display = 'none';
        video.style.display = 'block';
        
        captureBtn.style.display = 'inline-block';
        retakeBtn.style.display = 'none';
        saveBtn.style.display = 'none';
    });
    
    // Guardar foto (aquí puedes implementar la lógica para guardar la imagen)
    /*saveBtn.addEventListener('click', function() {
        // En una implementación real, aquí enviarías la imagen al servidor
        // Por ahora, solo mostraremos un mensaje
        alert('Foto guardada correctamente. Será procesada para identificar la prenda.');
        
        // Redirigir de vuelta a la página principal después de guardar
        setTimeout(() => {
            window.location.href = "{% url 'inicio' %}";
        }, 1500);
    });*/


    // Guardar foto 
    saveBtn.addEventListener('click', function() {
        // Muestra un mensaje de carga mientras se procesa y se envía
        alert('Enviando foto para guardar y procesar...'); 
        
        // 1. Obtener la imagen como un objeto Blob (archivo)
        canvas.toBlob(async function(blob) {
            if (!blob) {
                alert('Error: No se pudo generar el archivo de imagen.');
                return;
            }

            // 2. Pasar al siguiente paso: envío con fetch (ver 3.3)
            await sendImageToDjango(blob);

        }, 'image/png'); // Formato de la imagen: PNG

        // Detener la redirección automática que tenías antes.
        // La redirección ocurrirá DESPUÉS de un envío exitoso en sendImageToDjango.
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