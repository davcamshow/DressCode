document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Resetear errores
    clearErrors();
    
    // Obtener valores
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    
    let isValid = true;
    
    // Validar nombre
    if (!name) {
        showError('name-error', 'El nombre es obligatorio');
        isValid = false;
    } else if (name.length < 2) {
        showError('name-error', 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
        showError('name-error', 'El nombre solo puede contener letras y espacios');
        isValid = false;
    }
    
    // Validar email
    if (!email) {
        showError('email-error', 'El correo electrónico es obligatorio');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email-error', 'Ingresa un correo electrónico válido');
        isValid = false;
    }
    
    // Si todo es válido, enviar el formulario
    if (isValid) {
        this.submit();
    }
});

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para mostrar errores
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Resaltar campo con error
    const inputField = errorElement.previousElementSibling;
    inputField.style.borderColor = '#e74c3c';
}

// Función para limpiar errores
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
    
    // Restaurar bordes normales
    const inputFields = document.querySelectorAll('.input-field');
    inputFields.forEach(field => {
        field.style.borderColor = '#ddd';
    });
}

// Validación en tiempo real
document.getElementById('name').addEventListener('input', function() {
    const nameError = document.getElementById('name-error');
    if (nameError.style.display === 'block') {
        clearErrors();
    }
});

document.getElementById('email').addEventListener('input', function() {
    const emailError = document.getElementById('email-error');
    if (emailError.style.display === 'block') {
        clearErrors();
    }
});