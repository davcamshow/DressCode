# [file name]: views.py
from django.shortcuts import render, redirect
from django.db import connection, OperationalError
from django.contrib.auth import authenticate, login, logout
from .models import Usuario, Armario 
from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages 
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from supabase import create_client, Client
import uuid
import os
import logging
from django.views.decorators.http import require_POST
import json
from rembg import remove
from PIL import Image
import io
import requests
from PIL import UnidentifiedImageError



logger = logging.getLogger(__name__)

try:
    SUPABASE_URL = settings.SUPABASE_URL
    SUPABASE_KEY = settings.SUPABASE_KEY
    SUPABASE_STORAGE_BUCKET = settings.SUPABASE_STORAGE_BUCKET
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
except AttributeError:
    print("ADVERTENCIA: Las variables de Supabase no están configuradas en settings.py")

def home(request):
    return render(request, 'welcome.html')

def recovery_view(request):
    return render(request, 'recovery.html')

def newPassword_view(request):
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
            return redirect('Cuenta creada')
    return render(request, 'Password.html')

def capturar_view(request):
    """Renderiza la página para capturar fotos con la cámara."""
    return render(request, 'camera.html')

def exit_view(request):
    return render(request, 'Cuenta creada.html')

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
    return redirect('login')

def recovery_view(request):
    if request.method == 'POST':
        correo = request.POST.get('email')
        usuario = Usuario.objects.filter(email=correo).first()
        if usuario:
            request.session['recovery_email'] = correo
            return redirect('newPassword')
        else:
            return render(request, 'recovery.html', {'error': 'Este correo no está registrado.'})
    return render(request, 'recovery.html')

def newPassword_view(request):
    correo = request.session.get('recovery_email')
    error = None

    if request.method == 'POST':
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm-password')

        if password != confirm_password:
            error = 'Las contraseñas no coinciden.'
        elif len(password) < 8 or not any(c.isupper() for c in password) or not any(c.isdigit() for c in password) or not any(not c.isalnum() for c in password):
            error = 'La contraseña no cumple los requisitos.'
        else:
            usuario = Usuario.objects.filter(email=correo).first()
            if usuario:
                usuario.contrasena = make_password(password)
                usuario.save()
                del request.session['recovery_email']
                return redirect('home')
    return render(request, 'newPassword.html', {'error': error})

def my_closet(request):
    if 'usuario_id' not in request.session:
        messages.error(request, "Debes iniciar sesión para ver tu armario.")
        return redirect('login') 

    try:
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        prendas = Armario.objects.filter(idUsuario=usuario).order_by('-fecha')

        context = {
            'prendas_del_armario': prendas 
        }
        return render(request, 'myCloset.html', context)

    except Usuario.DoesNotExist:
        messages.error(request, "Error: No se encontró tu perfil de usuario.")
        return redirect('login')
    except Exception as e:
        print(f"Error al cargar el armario: {e}")
        messages.error(request, "Hubo un error al cargar tu armario digital.")
        return render(request, 'myCloset.html', {})

@csrf_exempt
def subir_prenda(request):
    if request.method == 'POST' and 'imagen_prenda' in request.FILES:
        if 'usuario_id' not in request.session:
            return JsonResponse({'error': 'Usuario no autenticado.'}, status=401)
        
        uploaded_file = request.FILES['imagen_prenda']
        
        # Obtener datos del formulario
        categoria = request.POST.get('categoria', 'Prenda de vestir')
        tipo = request.POST.get('tipo', 'Prenda de vestir')
        color = request.POST.get('color', 'Por definir')
        temporada = request.POST.get('temporada', 'Todo el año')
        estilo = request.POST.get('estilo', 'Casual')
        esFavorito = request.POST.get('esFavorito', 'false') == 'true'
        
        try:
            # SUBIR A SUPABASE STORAGE
            file_ext = os.path.splitext(uploaded_file.name)[1]
            unique_filename = f'{request.session["usuario_id"]}_{uuid.uuid4()}{file_ext}'
            path_on_storage = f'prendas/{unique_filename}'
            
            upload_response = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
                file=uploaded_file.read(),
                path=path_on_storage,
                file_options={"content-type": uploaded_file.content_type}
            )

            # OBTENER URL PÚBLICA
            public_url_response = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(path_on_storage)
            image_url = public_url_response

        except Exception as e:
            logger.error(f"Error al subir a Supabase: {e}")
            return JsonResponse({'error': f'Error al procesar la imagen: {str(e)}'}, status=500)
        
        # GUARDAR EN LA TABLA 'Armario' DE DJANGO
        try:
            usuario_id = request.session['usuario_id']
            usuario = Usuario.objects.get(idUsuario=usuario_id)

            nueva_prenda = Armario.objects.create(
                tipo=tipo,
                imagen=image_url,
                idUsuario=usuario,
                color=color,
                temporada=temporada,
                estilo=estilo,
                clasificacion=categoria,
                esFavorito=esFavorito
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Prenda guardada exitosamente.',
                'url': image_url,
                'prenda_id': nueva_prenda.idPrenda
            }, status=200)

        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Error interno: Usuario no encontrado.'}, status=500)
        except Exception as e:
            logger.error(f"Error al guardar en DB: {e}")
            return JsonResponse({'error': f'Error al guardar en la base de datos: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Petición inválida. Falta el archivo.'}, status=400)

def resultados_analisis(request, prenda_id):
    """Vista para mostrar detalles de la prenda"""
    try:
        prenda = Armario.objects.get(idPrenda=prenda_id)
        context = {
            'prenda': prenda
        }
        return render(request, 'resultados_analisis.html', context)
    except Armario.DoesNotExist:
        messages.error(request, "La prenda no fue encontrada.")
        return redirect('my_closet')
    
@csrf_exempt
@require_POST
def eliminar_prendas(request):
    """Elimina las prendas seleccionadas tanto de la base de datos como de Supabase Storage."""
    try:
        data = json.loads(request.body)
        ids = data.get('ids', [])

        if not ids:
            return JsonResponse({'status': 'error', 'message': 'No se recibieron IDs.'}, status=400)

        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return JsonResponse({'status': 'error', 'message': 'Usuario no autenticado.'}, status=401)

        # Obtener las prendas del usuario
        prendas = Armario.objects.filter(idPrenda__in=ids, idUsuario=usuario_id)

        if not prendas.exists():
            return JsonResponse({'status': 'error', 'message': 'No se encontraron las prendas.'}, status=404)

        # Eliminar imágenes de Supabase Storage
        for prenda in prendas:
            try:
                # Extraer el nombre del archivo desde la URL pública
                image_path = prenda.imagen.split('/storage/v1/object/public/')[1]
                supabase.storage.from_(SUPABASE_STORAGE_BUCKET).remove([image_path])
            except Exception as e:
                logger.warning(f"No se pudo eliminar imagen de Supabase: {e}")

        # Eliminar los registros de la base de datos
        prendas.delete()

        return JsonResponse({'status': 'ok', 'message': 'Prendas eliminadas correctamente.'})

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'JSON inválido.'}, status=400)
    except Exception as e:
        logger.error(f"Error al eliminar prendas: {e}")
        return JsonResponse({'status': 'ok', 'message': 'Prendas eliminadas correctamente.'})

def añadir_prenda(request):
    return render(request, 'add.html')

def seleccionar_categoria(request):
    """Vista para seleccionar categoría antes de capturar la prenda"""
    if 'usuario_id' not in request.session:
        messages.error(request, "Debes iniciar sesión para agregar prendas.")
        return redirect('login')
    
    return render(request, 'category.html')




def segmentar_y_subir(imagen_url, nombre_segmentado):
    response = requests.get(imagen_url)
    if response.status_code != 200:
        print("Error al descargar:", response.status_code)
        return None

    try:
        input_image = Image.open(io.BytesIO(response.content))
    except UnidentifiedImageError:
        print("No se pudo identificar la imagen:", imagen_url)
        return None

    output_image = remove(input_image)
    buffer = io.BytesIO()
    output_image.save(buffer, format="PNG")
    imagen_segmentada = buffer.getvalue()

    # Subir a Supabase
    path = f"segmentadas/{nombre_segmentado}"
    supabase.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
        file=imagen_segmentada,
        path=path,
        file_options={"content-type": "image/png"}
    )
    return supabase.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(path)

def segmentar_todas_las_prendas(request):
    prendas = Armario.objects.filter(imagen_segmentada__isnull=True)
    for prenda in prendas:
        nombre_segmentado = f"segmentada_{prenda.idPrenda}.png"
        url_segmentada = segmentar_y_subir(prenda.imagen, nombre_segmentado)
        if url_segmentada:
            prenda.imagen_segmentada = url_segmentada
            prenda.save()
    return JsonResponse({'status': 'ok', 'message': 'Segmentación completada'})

def outfit(request):
    return render(request, 'outfit.html')




