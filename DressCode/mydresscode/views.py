from django.shortcuts import render, redirect
from django.db import connection, OperationalError
from django.contrib.auth import authenticate, login, logout
from .models import Usuario,Armario 
from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages 
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from supabase import create_client, Client
import uuid
import os

try:
    SUPABASE_URL = settings.SUPABASE_URL
    SUPABASE_KEY = settings.SUPABASE_KEY
    SUPABASE_STORAGE_BUCKET = settings.SUPABASE_STORAGE_BUCKET # Asume que definiste este bucket name
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
except AttributeError:
    print("ADVERTENCIA: Las variables de Supabase no están configuradas en settings.py")
   


def predecir_prenda(imagen_binaria):
    """
    Función de IA que analiza la imagen. 
    Aquí pondrías la lógica de tu modelo de machine learning (TensorFlow, PyTorch, etc.).
    """
    # ** SIMULACIÓN DE LA IA **
    # Si la imagen es grande, asume que es un vestido. Si es pequeña, es un calcetín.
    # EN LA IMPLEMENTACIÓN FINAL, ESTO SE REEMPLAZA POR TU CÓDIGO REAL DE PREDICCIÓN.
    if len(imagen_binaria) > 500000: # 500 KB
        return "Vestido"
    elif len(imagen_binaria) > 100000:
        return "Camiseta"
    else:
        return "Accesorio"

# ... (El resto de tus vistas) ...

def home(request):
    """Renderiza la página de inicio."""
    return render(request, 'welcome.html')

def recovery_view(request):
    """Renderiza la página de recuperación de contraseña."""
    return render(request, 'recovery.html')

def newPassword_view(request):
    """Renderiza la página para establecer una nueva contraseña."""
    return render(request, 'newPassword.html')

def register_view(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        email = request.POST.get('email')
        request.session['nombre'] = nombre
        request.session['email'] = email
        return redirect('register_password')
    return render(request, 'register.html')

def register_password_view(request):
    if request.method == 'POST':
        contrasena = request.POST.get('contrasena')
        nombre = request.session.get('nombre')
        email = request.session.get('email')

        if nombre and email and contrasena:
            usuario = Usuario(
                nombre=nombre,
                email=email,
                contrasena=make_password(contrasena)
            )
            usuario.save()
            return redirect('Cuenta creada')  # o 'inicio' si prefieres
    return render(request, 'Password.html')

def capturar_view(request):
    """Renderiza la página para capturar fotos con la cámara."""
    return render(request, 'camera.html')

def exit_view(request):
    return render(request, 'Cuenta creada.html')
# añado para ver el inicio

def inicio(request):
    return render(request, 'inicio.html')

def login_view(request):
    """
    Maneja el inicio de sesión de usuarios de forma segura.
    """
    error = None

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            error = "El correo no está registrado."
            return render(request, 'login.html', {'error': error})

        if check_password(password, usuario.contrasena):
            # Autenticación exitosa
            request.session['usuario_id'] = usuario.idUsuario
            request.session['usuario_nombre'] = usuario.nombre
            return redirect('inicio')
        else:
            error = "La contraseña es incorrecta."
    return render(request, 'login.html', {'error': error})


def logout_view(request):
    """
    Cierra la sesión del usuario y lo redirige a la página de login.
    """
    messages.success(request, "Sesión cerrada exitosamente.")
    logout(request)
    return redirect('login') # Redirige a la URL con el nombre 'login'

def recovery_view(request):
    if request.method == 'POST':
        correo = request.POST.get('email')

        # Verifica si existe en la base de datos
        usuario = Usuario.objects.filter(email=correo).first()
        if usuario:
            # Guardamos el correo en la sesión
            request.session['recovery_email'] = correo
            return redirect('newPassword')
        else:
            return render(request, 'recovery.html', {'error': 'Este correo no está registrado.'})

    return render(request, 'recovery.html')


def newPassword_view(request):
    correo = request.session.get('recovery_email')  # Obtenemos correo de la sesión
    error = None  # Variable para enviar errores al template

    if request.method == 'POST':
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm-password')

        # Validación
        if password != confirm_password:
            error = 'Las contraseñas no coinciden.'
        elif len(password) < 8 or not any(c.isupper() for c in password) or not any(c.isdigit() for c in password) or not any(not c.isalnum() for c in password):
            error = 'La contraseña no cumple los requisitos.'
        else:
            # Actualizar contraseña
            usuario = Usuario.objects.filter(email=correo).first()
            if usuario:
                usuario.contrasena = password
                usuario.save()
                del request.session['recovery_email']  # Limpiamos sesión
                return redirect('home')  # Redirige a welcome

    return render(request, 'newPassword.html', {'error': error})

def my_closet(request):
    # 1. Verificar si el usuario está logueado
    if 'usuario_id' not in request.session:
        messages.error(request, "Debes iniciar sesión para ver tu armario.")
        return redirect('login') 

    try:
        # 2. Obtener el objeto Usuario a partir del ID de la sesión
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id) 

        # 3. CONSULTA CLAVE: Obtener todas las prendas del usuario actual
        # Aquí colocas la línea de código para filtrar el modelo Armario
        # por el usuario logueado (idUsuario=usuario) y ordenarlas por fecha.
        prendas = Armario.objects.filter(idUsuario=usuario).order_by('-fecha')

        # 4. Crear el contexto para enviar los datos al template
        context = {
            # 'prendas_del_armario' es el nombre que usarás en myCloset.html
            'prendas_del_armario': prendas 
        }

        # 5. Renderizar el template
        return render(request, 'myCloset.html', context)

    except Usuario.DoesNotExist:
        messages.error(request, "Error: No se encontró tu perfil de usuario.")
        return redirect('login')
    except Exception as e:
        print(f"Error al cargar el armario: {e}")
        messages.error(request, "Hubo un error al cargar tu armario digital.")
        return render(request, 'myCloset.html', {})




@csrf_exempt # NECESARIO para que reciba el POST de fetch sin el formulario de Django
def subir_prenda(request):
    if request.method == 'POST' and 'imagen_prenda' in request.FILES:
        # Asegúrate de que el usuario esté logueado
        if 'usuario_id' not in request.session:
            return JsonResponse({'error': 'Usuario no autenticado.'}, status=401)
        
        uploaded_file = request.FILES['imagen_prenda']
        
        # 1. EJECUTAR IA
        try:
            # uploaded_file.read() lee el contenido binario para la IA
            etiqueta_prenda = predecir_prenda(uploaded_file.read()) 
            # Necesitamos "rebobinar" el archivo después de leerlo para poder subirlo
            uploaded_file.seek(0)
        except Exception as e:
            return JsonResponse({'error': f'Error en el algoritmo de IA: {str(e)}'}, status=500)

        
        # 2. SUBIR A SUPABASE STORAGE
        try:
            file_ext = os.path.splitext(uploaded_file.name)[1]
            # Generar un nombre único para evitar colisiones
            unique_filename = f'{request.session["usuario_id"]}_{uuid.uuid4()}{file_ext}'
            path_on_storage = f'prendas/{unique_filename}' # Carpeta/archivo en Supabase
            
            # Subir el archivo al bucket
            upload_response = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
                file=uploaded_file.read(),
                path=path_on_storage,
                file_options={"content-type": uploaded_file.content_type}
            )

            # 3. OBTENER URL PÚBLICA
            public_url_response = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(path_on_storage)
            image_url = public_url_response # Esta es la URL que necesitamos

        except Exception as e:
            print(f"Error al interactuar con Supabase: {e}")
            return JsonResponse({'error': f'Error al subir a Supabase: {str(e)}'}, status=500)

        
        # 4. GUARDAR EN LA TABLA 'Prenda' DE DJANGO
        try:
            # Obtener el objeto Usuario (asumiendo que tu modelo 'Usuario' es el que se usa)
            usuario_id = request.session['usuario_id']
            usuario = Usuario.objects.get(idUsuario=usuario_id)

            Armario.objects.create(
                tipo=etiqueta_prenda,         # Resultado de la IA
                imagen=image_url,             # URL de Supabase Storage
                idUsuario=usuario,                  # Usuario logueado
                color='Desconocido',              
                temporada='N/A',                  
                estilo='N/A',
                clasificacion='N/A',
            )
            
            return JsonResponse({'message': 'Prenda subida y URL guardada.', 'url': image_url}, status=200)

        except Usuario.DoesNotExist:
             return JsonResponse({'error': 'Error interno: Usuario no encontrado.'}, status=500)
        except Exception as e:
            print(f"Error al guardar en DB de Django: {e}")
            return JsonResponse({'error': f'Error al guardar en la base de datos: {str(e)}'}, status=500)

    # Si no es POST o falta el archivo
    return JsonResponse({'error': 'Petición inválida. Falta el archivo.'}, status=400)