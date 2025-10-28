// [file name]: categoria.js
document.addEventListener('DOMContentLoaded', function() {
    const categoryOptions = document.querySelectorAll('.category-option');
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const categoriaInput = document.getElementById('categoria');
    const tipoSelect = document.getElementById('tipo');
    const cancelFormBtn = document.getElementById('cancel-form');
    const prendaForm = document.getElementById('prenda-form');
    
    let selectedCategory = null;
    
    // Manejar selección de categoría
    categoryOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover selección anterior
            categoryOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Marcar como seleccionada
            this.classList.add('selected');
            selectedCategory = this.dataset.category;
            
            // Mostrar formulario
            showForm(selectedCategory);
        });
    });
    
    // Mostrar formulario según categoría seleccionada
    function showForm(category) {
        const categoryData = CATEGORIA_DATA[category];
        
        // Actualizar título del formulario
        formTitle.textContent = `Detalles del ${categoryData.title}`;
        
        // Establecer categoría en el campo oculto
        categoriaInput.value = category;
        
        // Llenar opciones de tipo
        tipoSelect.innerHTML = '<option value="">Selecciona un tipo</option>';
        categoryData.tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            tipoSelect.appendChild(option);
        });
        
        // Mostrar formulario con animación
        formContainer.style.display = 'block';
        setTimeout(() => {
            formContainer.style.opacity = '1';
            formContainer.style.transform = 'translateY(0)';
        }, 10);
        
        // Desplazar hacia el formulario
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Cancelar formulario
    cancelFormBtn.addEventListener('click', function() {
        // Ocultar formulario
        formContainer.style.opacity = '0';
        formContainer.style.transform = 'translateY(20px)';
        setTimeout(() => {
            formContainer.style.display = 'none';
        }, 300);
        
        // Deseleccionar categoría
        categoryOptions.forEach(opt => opt.classList.remove('selected'));
        selectedCategory = null;
        
        // Desplazar hacia las categorías
        document.querySelector('.category-selection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    });
    
    // Enviar formulario
    prendaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!validateForm()) {
            return;
        }
        
        // Recopilar datos del formulario
        const formData = {
            categoria: categoriaInput.value,
            tipo: tipoSelect.value,
            color: document.getElementById('color').value,
            temporada: document.getElementById('temporada').value,
            estilo: document.getElementById('estilo').value,
            esFavorito: document.getElementById('esFavorito').checked
        };
        
        // Guardar datos en sessionStorage para usar en la cámara
        sessionStorage.setItem('prendaData', JSON.stringify(formData));
        
        // CORREGIDO: Usar la variable global CAMERA_URL
        window.location.href = CAMERA_URL;
    });
    
    // Validar formulario
    function validateForm() {
        let isValid = true;
        
        // Validar tipo
        if (!tipoSelect.value) {
            showFieldError(tipoSelect, 'Por favor selecciona un tipo');
            isValid = false;
        } else {
            clearFieldError(tipoSelect);
        }
        
        // Validar color
        const colorInput = document.getElementById('color');
        if (!colorInput.value.trim()) {
            showFieldError(colorInput, 'Por favor ingresa un color');
            isValid = false;
        } else {
            clearFieldError(colorInput);
        }
        
        return isValid;
    }
    
    // Mostrar error en campo
    function showFieldError(field, message) {
        field.style.borderColor = '#e06e78';
        
        // Remover mensaje de error existente
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Crear mensaje de error
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.color = '#e06e78';
        errorElement.style.fontSize = '0.8em';
        errorElement.style.marginTop = '5px';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }
    
    // Limpiar error del campo
    function clearFieldError(field) {
        field.style.borderColor = '#ddd';
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
    
    // Función para mostrar mensajes
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
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }
    
    // Efectos visuales adicionales
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
});