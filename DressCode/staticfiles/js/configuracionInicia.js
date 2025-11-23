
// onboarding.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS HTML ---
    const modal = document.getElementById('onboardingModal');
    const stepsContainer = document.getElementById('onboardingSteps');
    const steps = stepsContainer.querySelectorAll('.step');
    const progressBar = document.getElementById('progressBar');
    const stepIndicator = document.getElementById('stepIndicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    // Indicadores de retroalimentación
    const selectedStylesSpan = document.getElementById('selected-styles');
    const selectedColorsSpan = document.getElementById('selected-colors');
    const selectedSeasonsSpan = document.getElementById('selected-seasons');
    
    // --- VARIABLES DE ESTADO ---
    const totalSteps = steps.length; // Es 4
    let currentStep = 1;

    // Objeto para almacenar todas las respuestas
    const onboardingData = {
        estilos: [],
        colores: [],
        temporadas: [],
        tallaSuperior: '',
        tallaInferior: '',
        tallaCalzado: '',
        ubicacion: '',
        clima: ''
    };

    // Muestra el modal al cargar
    modal.style.display = 'grid'; 

    // --- FUNCIÓN DE ACTUALIZACIÓN DE TEXTO ---
    const updateSelectionText = (dataArrayName, spanElement) => {
        const data = onboardingData[dataArrayName];
        if (data.length === 0) {
            spanElement.textContent = 'Ninguno';
        } else {
            // Muestra los elementos separados por comas, con la primera letra en mayúscula
            spanElement.textContent = data.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
        }
    };

    // --- FUNCIÓN DE ACTUALIZACIÓN DE PASO ---
    const updateStep = () => {
        // Oculta/Muestra el paso actual
        steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            }
        });

        // Actualiza barra de progreso
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = progress + '%';
        stepIndicator.textContent = `Paso ${currentStep} de ${totalSteps}`;

        // Muestra/Oculta botones
        prevBtn.style.visibility = currentStep > 1 ? 'visible' : 'hidden';
        
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
        }
    };
    
    // --- FUNCIÓN DE TOGGLE PARA TARJETAS (Selección múltiple) ---
    const setupToggleSelection = (selector, dataArrayName, feedbackSpan) => {
        const cards = stepsContainer.querySelectorAll(selector);
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const value = card.dataset[dataArrayName];
                const index = onboardingData[dataArrayName].indexOf(value);
                
                if (card.classList.contains('selected')) {
                    // Deseleccionar
                    card.classList.remove('selected');
                    if (index > -1) {
                        onboardingData[dataArrayName].splice(index, 1);
                    }
                } else {
                    // Lógica especial para Colores: máximo 3
                    if (dataArrayName === 'colores' && onboardingData.colores.length >= 3) {
                        alert("Solo puedes seleccionar un máximo de 3 colores.");
                        return;
                    }
                    // Seleccionar
                    card.classList.add('selected');
                    if (index === -1) {
                        onboardingData[dataArrayName].push(value);
                    }
                }
                
                // Actualiza el texto de retroalimentación
                updateSelectionText(dataArrayName, feedbackSpan);
            });
        });
    };

    // --- INICIALIZACIÓN DE LA INTERACCIÓN ---
    // Paso 1: Estilos
    setupToggleSelection('.style-card', 'style', selectedStylesSpan); 
    // Paso 2: Colores (Máx 3)
    setupToggleSelection('.color-option', 'color', selectedColorsSpan); 
    // Paso 3: Temporadas
    setupToggleSelection('.season-card', 'season', selectedSeasonsSpan); 
    
    // --- NAVEGACIÓN ---
    nextBtn.addEventListener('click', () => {
        // Validación mínima
        if (currentStep === 1 && onboardingData.estilos.length === 0) {
            alert('Por favor, selecciona al menos un estilo.');
            return;
        }
        if (currentStep === 2 && onboardingData.colores.length === 0) {
             alert('Por favor, selecciona al menos un color favorito.');
             return;
        }
        if (currentStep === 3 && onboardingData.temporadas.length === 0) {
            alert('Por favor, selecciona al menos una temporada favorita.');
            return;
        }

        if (currentStep < totalSteps) {
            currentStep++;
            updateStep();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStep();
        }
    });

    // --- FINALIZAR Y ENVIAR DATOS A DJANGO/SUPABASE ---
    finishBtn.addEventListener('click', () => {
        // 1. Recoger datos finales del Paso 4 (Ubicación Y Tallas)
        onboardingData.tallaSuperior = document.getElementById('talla-superior').value.trim();
        onboardingData.tallaInferior = document.getElementById('talla-inferior').value.trim();
        onboardingData.tallaCalzado = document.getElementById('talla-calzado').value; 
        
        onboardingData.ubicacion = document.getElementById('city').value.trim();
        onboardingData.clima = document.getElementById('climate').value;
        
        // Validación final
        if (onboardingData.tallaSuperior === '' || onboardingData.tallaInferior === '' || onboardingData.tallaCalzado === '') {
            alert('Debes ingresar tus tallas superior, inferior y de calzado.');
            return;
        }
        if (onboardingData.ubicacion.length < 3 || onboardingData.clima === '') {
            alert('Debes ingresar tu ciudad y seleccionar tu tipo de clima.');
            return;
        }
        
        finishBtn.disabled = true;

        // 2. Enviar los datos al backend de Django
        fetch('/api/onboarding-submit/', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN 
            },
            body: JSON.stringify(onboardingData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('¡Configuración completada! Redirigiendo...');
                modal.style.display = 'none'; 
                window.location.reload(); 
            } else {
                alert('Error al guardar la configuración: ' + data.message);
                finishBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error de conexión:', error);
            alert('Error de conexión. Intenta de nuevo.');
            finishBtn.disabled = false;
        });
    });

    // Inicializa el primer paso
    updateStep();
    updateSelectionText('estilos', selectedStylesSpan);
    updateSelectionText('colores', selectedColorsSpan);
    updateSelectionText('temporadas', selectedSeasonsSpan);
});