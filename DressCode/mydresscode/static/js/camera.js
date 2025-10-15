document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoPreview = document.getElementById('photo-preview');
    const captureBtn = document.getElementById('capture-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const saveBtn = document.getElementById('save-btn');
    
    let stream = null;
    
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
    saveBtn.addEventListener('click', function() {
        // En una implementación real, aquí enviarías la imagen al servidor
        // Por ahora, solo mostraremos un mensaje
        alert('Foto guardada correctamente. Será procesada para identificar la prenda.');
        
        // Redirigir de vuelta a la página principal después de guardar
        setTimeout(() => {
            window.location.href = "{% url 'inicio' %}";
        }, 1500);
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