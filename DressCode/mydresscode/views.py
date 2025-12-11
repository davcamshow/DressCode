
from django.shortcuts import render, redirect, get_object_or_404
from django.db import connection, OperationalError
from django.contrib.auth import authenticate, login, logout
from .models import Usuario, Armario, Outfit, VerPrenda, Profile, Recomendacion
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
from datetime import datetime
import random   
from django.contrib.auth.decorators import login_required # Se mantiene para otros usos, pero no en el Wizard
from formtools.wizard.views import SessionWizardView
from django.urls import reverse
from django.utils.decorators import method_decorator
import base64
from django.core.files.base import ContentFile
import numpy as np
from django.views.decorators.http import require_http_methods 
# Importa tus modelos y formularios
from .forms import EstiloForm, ColorForm, EstacionForm, TallaForm 
from .models import Profile, Usuario 
from datetime import date, datetime, timedelta
import calendar
from django.utils import timezone
from datetime import datetime, timedelta
from .models import CalendarEventos, Usuario
from calendar import monthrange, HTMLCalendar
from django.http import HttpResponseRedirect
from .google_auth import GoogleOAuth
logger = logging.getLogger(__name__)

try:
    SUPABASE_URL = settings.SUPABASE_URL
    SUPABASE_KEY = settings.SUPABASE_KEY
    SUPABASE_STORAGE_BUCKET = settings.SUPABASE_STORAGE_BUCKET
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
except AttributeError:
    print("ADVERTENCIA: Las variables de Supabase no están configuradas en settings.py")

# ---------------------------------------------------------------------------------
# 1. DECORADOR DE REDIRECCIÓN (Control de Acceso y Onboarding)
# ---------------------------------------------------------------------------------
def configuracion_requerida(view_func):
    """
    Verifica que el usuario tenga una sesión activa ('usuario_id')
    Y que haya completado la configuración inicial ('config_completada').
    """
    def wrapper_func(request, *args, **kwargs):
        usuario_id = request.session.get('usuario_id')
        
        # 1. VERIFICACIÓN DE SESIÓN (Si no hay ID en sesión, redirige al login)
        if not usuario_id:
             return redirect('login') 
        
        # 2. VERIFICACIÓN DE CONFIGURACIÓN
        try:
            user_instance = Usuario.objects.get(idUsuario=usuario_id)
            
            # ✅ CORRECCIÓN: Manejar tanto perfiles únicos como múltiples
            try:
                profile = Profile.objects.get(user=user_instance)
            except Profile.MultipleObjectsReturned:
                # Si hay múltiples, usar el más reciente
                profile = Profile.objects.filter(user=user_instance).latest('creado_en')
                print(f"⚠️ Advertencia: Múltiples perfiles para usuario {user_instance.idUsuario}. Usando el más reciente.")
                
        except Usuario.DoesNotExist:
            # Si el usuario no existe, forzamos login
            return redirect('login') 
        except Profile.DoesNotExist:
            # Si no hay perfil, forzamos el asistente
            return redirect(reverse('configuracion_inicial'))

        # Si la configuración NO está completa, forzamos el asistente
        if not profile.config_completada:
            return redirect(reverse('configuracion_inicial'))
                
        # Si todo está OK, procede a la vista
        return view_func(request, *args, **kwargs)
    return wrapper_func


# ---------------------------------------------------------------------------------
# 2. VISTAS PRINCIPALES Y PROTEGIDAS
# ---------------------------------------------------------------------------------

def home(request):
    return render(request, 'welcome.html')

def recovery_view(request):
    # FIX: Inicializar error aquí para evitar UnboundLocalError en la petición GET
    error = None 
    if request.method == 'POST':
        correo = request.POST.get('email')
        usuario = Usuario.objects.filter(email=correo).first()
        if usuario:
            request.session['recovery_email'] = correo
            return redirect('newPassword')
        else:
            return render(request, 'recovery.html', {'error': 'Este correo no está registrado.'})
    return render(request, 'recovery.html', {'error': error})


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
        confirmar_contrasena = request.POST.get('confirmar_contrasena')
        nombre = request.session.get('nombre')
        email = request.session.get('email')

        # Validaciones de contraseña...
        if contrasena != confirmar_contrasena:
            return render(request, 'Password.html', {'error': 'Las contraseñas no coinciden'})
        
        if (len(contrasena) < 8 or 
            not any(c.isupper() for c in contrasena) or 
            not any(c.isdigit() for c in contrasena) or 
            not any(not c.isalnum() for c in contrasena)):
            return render(request, 'Password.html', {'error': 'La contraseña no cumple los requisitos'})

        if nombre and email and contrasena:
            # ✅ USAR get_or_create PARA EVITAR DUPLICADOS
            usuario, created = Usuario.objects.get_or_create(
                email=email,
                defaults={
                    'nombre': nombre,
                    'contrasena': make_password(contrasena)
                }
            )
            
            if created:
                # El signal @receiver(post_save, sender=Usuario) ya creará el perfil automáticamente
                print(f"✅ Usuario creado: {usuario.email}")
            else:
                # Si el usuario ya existe, actualizar contraseña
                usuario.contrasena = make_password(contrasena)
                usuario.save()
            
            # ✅ NO crear perfil manualmente aquí - el signal se encarga
            
            # Limpiar session
            if 'nombre' in request.session:
                del request.session['nombre']
            if 'email' in request.session:
                del request.session['email']
            
            # ✅ MODIFICADO: Redirigir a login con parámetro en URL
            return redirect(reverse('login') + '?registration_success=true')
    
    return render(request, 'Password.html')


def login_view(request):
    """
    Maneja el inicio de sesión de usuarios de forma segura.
    """
    error = None 
    show_success_modal = False

    # ✅ VERIFICAR PARÁMETRO EN LA URL
    registration_success = request.GET.get('registration_success')
    if registration_success == 'true':
        show_success_modal = True

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            error = "El correo no está registrado."
            return render(request, 'login.html', {'error': error})

        if check_password(password, usuario.contrasena):
            # Establece la sesión con tu ID de usuario
            request.session['usuario_id'] = usuario.idUsuario
            request.session['usuario_nombre'] = usuario.nombre
            
            # Redirige al destino protegido
            return redirect('dashboard')
        else:
            error = "La contraseña es incorrecta."
    
    return render(request, 'login.html', {
        'error': error, 
        'show_success_modal': show_success_modal
    })
    
def logout_view(request):
    """
    Cierra la sesión del usuario y lo redirige a la página de login.
    """
    messages.success(request, "Sesión cerrada exitosamente.")
    # Aunque tu usuario no es User, logout() limpia la sesión de Django.
    logout(request) 
    # Limpia también tu ID de sesión custom
    if 'usuario_id' in request.session:
        del request.session['usuario_id']
    
    return redirect('login')


# ... imports y código anterior se mantienen igual ...

@configuracion_requerida
def dashboard_view(request):
    usuario_id = request.session.get("usuario_id")

    # Obtener accesorios
    accesorios = Armario.objects.filter(
        idUsuario=usuario_id,
        clasificacion="accesorio"
    )

    # SOLO USAR LAS IMÁGENES SEGMENTADAS para accesorios
    imagenes_accesorios = [
        acc.imagen_segmentada
        for acc in accesorios
        if acc.imagen_segmentada
    ]

    # OBTENER PRENDAS DEL USUARIO PARA EL CARRUSEL
    prendas_usuario = Armario.objects.filter(idUsuario=usuario_id)
    
    # Preparar datos para el carrusel
    def preparar_datos_carrusel():
        segmento_1 = []  # Camisas, tops, sudaderas, chalecos
        segmento_2 = []  # Pantalones, faldas, shorts
        segmento_3 = []  # Calzado
        
        # Palabras clave para cada categoría (en español e inglés)
        keywords_segmento_1 = [
            'camisa', 'blusa', 'top', 't-shirt', 'camiseta', 'playera', 
            'sudadera', 'hoodie', 'sudader', 'chaleco', 'chaqueta ligera',
            'shirt', 'blouse', 'tank', 'tank top', 'tank-top', 'sweatshirt',
            'tshirt', 't shirt', 'tee', 't-shirt', 'camiset', 'suéter ligero',
            'polo', 'camisa manga larga', 'camisa manga corta', 'blusón',
            'top corto', 'crop top', 'body', 'bodies'
        ]
        
        keywords_segmento_2 = [
            'pantalón', 'pantalon', 'jeans', 'pantalones', 'falda', 
            'skirt', 'shorts', 'bermuda', 'short', 'pants', 'leggings',
            'trousers', 'slacks', 'jean', 'legging', 'shorts', 'bermudas',
            'falda larga', 'falda corta', 'minifalda', 'midi', 'maxi',
            'pantalón corto', 'pantalones cortos', 'pantalón largo',
            'pantalón de vestir', 'pantalón deportivo'
        ]
        
        keywords_segmento_3 = [
            'zapato', 'zapatos', 'shoe', 'shoes', 'tenis', 'sneaker', 
            'sandalias', 'sandalia', 'botas', 'bota', 'tacón', 'tacon',
            'sneakers', 'boot', 'boots', 'sandals', 'heels', 'flats',
            'zapatilla', 'zapatillas', 'tacones', 'plataforma', 'mocasín',
            'zapato deportivo', 'zapato casual', 'zapato formal',
            'zapato de tacón', 'zapato plano', 'alpargata', 'chancla'
        ]
        
        for prenda in prendas_usuario:
            tipo_lower = prenda.tipo.lower() if prenda.tipo else ""
            imagen = prenda.imagen_segmentada if prenda.imagen_segmentada else prenda.imagen
            
            if not imagen:
                continue  # Saltar prendas sin imagen
                
            prenda_data = {
                'imagen': imagen,
                'tipo': prenda.tipo or "Prenda sin nombre",
                'color': prenda.color or "Color no especificado",
                'id': prenda.idPrenda
            }
            
            # Verificar a qué segmento pertenece
            encontrada = False
            
            # Segmento 1: Camisas, tops, sudaderas, chalecos
            for keyword in keywords_segmento_1:
                if keyword in tipo_lower:
                    segmento_1.append(prenda_data)
                    encontrada = True
                    break
            
            if not encontrada:
                # Segmento 2: Pantalones, faldas, shorts
                for keyword in keywords_segmento_2:
                    if keyword in tipo_lower:
                        segmento_2.append(prenda_data)
                        encontrada = True
                        break
            
            if not encontrada:
                # Segmento 3: Calzado
                for keyword in keywords_segmento_3:
                    if keyword in tipo_lower:
                        segmento_3.append(prenda_data)
                        encontrada = True
                        break
            
            # Si no coincide con ninguna categoría específica, asignar por defecto al segmento 1
            if not encontrada:
                segmento_1.append(prenda_data)
        
        # Ordenar por ID para consistencia
        segmento_1.sort(key=lambda x: x['id'] or 0)
        segmento_2.sort(key=lambda x: x['id'] or 0)
        segmento_3.sort(key=lambda x: x['id'] or 0)
        
        return segmento_1, segmento_2, segmento_3
    
    segmento_1, segmento_2, segmento_3 = preparar_datos_carrusel()
    
    # DEBUG: Imprimir información
    print(f"=== DEBUG CARRUSEL - Usuario: {usuario_id} ===")
    print(f"Segmento 1 (Superior): {len(segmento_1)} prendas")
    for p in segmento_1:
        print(f"  - {p['tipo']} ({p['color']})")
    
    print(f"Segmento 2 (Medio): {len(segmento_2)} prendas")
    for p in segmento_2:
        print(f"  - {p['tipo']} ({p['color']})")
    
    print(f"Segmento 3 (Inferior): {len(segmento_3)} prendas")
    for p in segmento_3:
        print(f"  - {p['tipo']} ({p['color']})")
    print("=" * 50)
    
    return render(request, "inicio.html", {
        "imagenes_accesorios": imagenes_accesorios,
        "prendas_segmento_1": segmento_1,
        "prendas_segmento_2": segmento_2,
        "prendas_segmento_3": segmento_3
    })


@configuracion_requerida
def inicio(request):
    """Tu vista de inicio protegida."""
    return render(request, 'inicio.html')

def capturar_view(request):
    """Renderiza la página para capturar fotos con la cámara."""
    return render(request, 'camera.html')

def exit_view(request):
    return render(request, 'Cuenta creada.html')

@configuracion_requerida
def my_closet(request):
    if 'usuario_id' not in request.session:
        messages.error(request, "Debes iniciar sesión para ver tu armario.")
        return redirect('login') 

    try:
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        prendas = Armario.objects.filter(idUsuario=usuario).order_by('-fecha')
        
        # ✅ CONTAR LOS OUTFITS DEL USUARIO
        outfits_count = Outfit.objects.filter(idUsuario=usuario).count()
        
        # ✅ CONTAR OUTFITS FAVORITOS
        outfits_favoritos_count = Outfit.objects.filter(
            idUsuario=usuario, 
            esFavorito=True
        ).count()
        
        # ✅ CONTAR EVENTOS DEL CALENDARIO
        eventos_count = CalendarEventos.objects.filter(
            id_usuario=usuario
        ).count()
        
        # ✅ CONTAR EVENTOS PRÓXIMOS (en los próximos 7 días)
        from datetime import date, timedelta
        hoy = date.today()
        proxima_semana = hoy + timedelta(days=7)
        
        eventos_proximos_count = CalendarEventos.objects.filter(
            id_usuario=usuario,
            event_date__gte=hoy,
            event_date__lte=proxima_semana
        ).count()
        
        # DEBUG: Verificar información
        print(f"=== DEBUG MY_CLOSET ===")
        print(f"Usuario: {usuario}")
        print(f"Número de prendas: {prendas.count()}")
        print(f"Número total de outfits: {outfits_count}")
        print(f"Número de outfits favoritos: {outfits_favoritos_count}")
        print(f"Número total de eventos: {eventos_count}")
        print(f"Eventos próximos (7 días): {eventos_proximos_count}")
        
        context = {
            'prendas_del_armario': prendas,
            'outfits_count': outfits_count,
            'outfits_favoritos_count': outfits_favoritos_count,
            'eventos_count': eventos_count,  # ✅ Nuevo
            'eventos_proximos_count': eventos_proximos_count,  # ✅ Nuevo
        }
        return render(request, 'myCloset.html', context)

    except Usuario.DoesNotExist:
        messages.error(request, "Error: No se encontró tu perfil de usuario.")
        return redirect('login')
    except Exception as e:
        print(f"Error al cargar el armario: {e}")
        messages.error(request, "Hubo un error al cargar tu armario digital.")
        return render(request, 'myCloset.html', {})
    
def categoria(request):
    return render(request, 'category.html')

def sobre_nosotros(request):
    return render(request, 'sobreNosotros.html')

def contacto(request):
    return render(request, 'contacto.html')

@csrf_exempt
def subir_prenda(request):
    if request.method == 'POST' and 'imagen_prenda' in request.FILES:
        if 'usuario_id' not in request.session:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado.'}, status=401)
        
        uploaded_file = request.FILES['imagen_prenda']
        
        try:
            # Obtener datos del formulario con valores por defecto
            categoria = request.POST.get('categoria', 'prenda')
            tipo = request.POST.get('tipo', 'Prenda de vestir')
            color = request.POST.get('color', 'Por definir')
            temporada = request.POST.get('temporada', 'Todo el año')
            estilo = request.POST.get('estilo', 'Casual')
            esFavorito = request.POST.get('esFavorito', 'false') == 'true'
            
            print(f"DEBUG - Datos recibidos:")
            print(f"  Categoría: {categoria}")
            print(f"  Tipo: {tipo}")
            print(f"  Color: {color}")
            print(f"  Temporada: {temporada}")
            print(f"  Estilo: {estilo}")
            print(f"  Favorito: {esFavorito}")

            # SUBIR A SUPABASE STORAGE
            file_ext = os.path.splitext(uploaded_file.name)[1]
            unique_filename = f'{request.session["usuario_id"]}_{uuid.uuid4()}{file_ext}'
            path_on_storage = f'prendas/{unique_filename}'
            
            # Leer el archivo
            uploaded_file.seek(0)  # Asegurarse de estar al inicio del archivo
            file_content = uploaded_file.read()
            
            print(f"DEBUG - Subiendo archivo: {unique_filename}")

            # Subir a Supabase
            upload_response = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
                file=file_content,
                path=path_on_storage,
                file_options={"content-type": uploaded_file.content_type}
            )
            
            print(f"DEBUG - Upload response: {upload_response}")

            # OBTENER URL PÚBLICA
            public_url_response = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(path_on_storage)
            image_url = public_url_response
            
            print(f"DEBUG - URL de imagen: {image_url}")

        except Exception as e:
            logger.error(f"Error al subir a Supabase: {str(e)}")
            print(f"ERROR DETALLADO Supabase: {str(e)}")
            return JsonResponse({
                'success': False, 
                'error': f'Error al procesar la imagen: {str(e)}'
            }, status=500)
        
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
            
            print(f"✅ Prenda guardada en DB con ID: {nueva_prenda.idPrenda}")
            
            # ✅ Respuesta de éxito INCLUYENDO EL ID DE LA PRENDA
            response_data = {
                'success': True,
                'message': 'Prenda guardada exitosamente.',
                'url': image_url,
                'prenda_id': nueva_prenda.idPrenda  # ✅ IMPORTANTE: Incluir el ID para la segmentación
            }
            
            return JsonResponse(response_data, status=200)

        except Usuario.DoesNotExist:
            error_msg = 'Error interno: Usuario no encontrado.'
            print(f"❌ ERROR: {error_msg}")
            return JsonResponse({'success': False, 'error': error_msg}, status=500)
        except Exception as e:
            logger.error(f"Error al guardar en DB: {e}")
            print(f"❌ ERROR DB: {str(e)}")
            return JsonResponse({
                'success': False, 
                'error': f'Error al guardar en la base de datos: {str(e)}'
            }, status=500)

    # Si no es POST o no tiene archivo
    error_msg = 'Petición inválida. Método debe ser POST y debe incluir archivo.'
    print(f"❌ ERROR: {error_msg}")
    return JsonResponse({'success': False, 'error': error_msg}, status=400)

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



@configuracion_requerida
def seleccionar_categoria(request):
    """Vista para seleccionar categoría antes de capturar la prenda"""
    if 'usuario_id' not in request.session:
        messages.error(request, "Debes iniciar sesión para agregar prendas.")
        return redirect('login')
    
    # ✅ Pasar todas las URLs necesarias al template
    context = {
        'camera_url': reverse('camera'),
        'my_closet_url': reverse('my_closet'),
        'inicio_url': reverse('inicio')
    }
    
    return render(request, 'category.html', context)

@configuracion_requerida
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

@configuracion_requerida
def segmentar_todas_las_prendas(request):
    prendas = Armario.objects.filter(imagen_segmentada__isnull=True)
    for prenda in prendas:
        nombre_segmentado = f"segmentada_{prenda.idPrenda}.png"
        url_segmentada = segmentar_y_subir(prenda.imagen, nombre_segmentado)
        if url_segmentada:
            prenda.imagen_segmentada = url_segmentada
            prenda.save()
    return JsonResponse({'status': 'ok', 'message': 'Segmentación completada'})

def vision_computer(request):
    return render(request, 'visioncomputer.html')

def outfit(request):
    return render(request, 'outfit.html')

def vision_computer(request):
    return render(request, 'visioncomputer.html')

def sideface_view(request):
    """Vista para mostrar el perfil del usuario con datos reales desde la BD"""
    if 'usuario_id' not in request.session:
        messages.error(request, "Debes iniciar sesión para ver tu perfil.")
        return redirect('login')
    
    try:
        usuario_id = request.session['usuario_id']
        
        # Obtener datos del usuario desde la tabla Usuario
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        
        # Obtener perfil del usuario desde la tabla Profile
        profile = Profile.objects.get(user=usuario_id)
        
        # Obtener iniciales para el avatar
        def get_iniciales(nombre):
            if not nombre:
                return "US"
            palabras = nombre.split()
            if len(palabras) >= 2:
                return f"{palabras[0][0]}{palabras[-1][0]}".upper()
            elif len(palabras) == 1:
                return nombre[:2].upper()
            else:
                return "US"
        
        # Procesar colores para asegurar formato válido
        colores_fav = profile.colores_fav or ['#a47968']  # Color por defecto
        
        # Si los colores no están en formato HEX, mapearlos
        color_map = {
            'rojo': '#ff0000',
            'azul': '#0000ff', 
            'verde': '#00ff00',
            'amarillo': '#ffff00',
            'negro': '#000000',
            'blanco': '#ffffff',
            'rosa': '#ff69b4',
            'morado': '#800080',
            'naranja': '#ffa500',
            'gris': '#808080',
            'marron': '#8b4513',
            'beige': '#f5f5dc',
            'cafe': '#8b4513',
            'azul marino': '#000080',
            'verde oscuro': '#006400',
            'turquesa': '#40e0d0',
            'lila': '#c8a2c8',
            'dorado': '#ffd700',
            'plateado': '#c0c0c0',
        }
        
        colores_procesados = []
        for color in colores_fav:
            color_lower = str(color).lower().strip()
            if color_lower in color_map:
                colores_procesados.append(color_map[color_lower])
            elif color_lower.startswith('#'):
                # Validar formato HEX
                if len(color_lower) in [4, 7]:  # #fff o #ffffff
                    colores_procesados.append(color_lower)
                else:
                    colores_procesados.append('#a47968')
            else:
                # Si no es un color reconocido, usar el por defecto
                colores_procesados.append('#a47968')
        
        # Si no hay colores, usar el por defecto
        if not colores_procesados:
            colores_procesados = ['#a47968']
        
        # Procesar estilos favoritos
        estilos_fav = profile.estilos or ['Casual']
        if isinstance(estilos_fav, str):
            # Si es string, convertirlo a lista
            estilos_fav = [estilo.strip() for estilo in estilos_fav.split(',')]
        
        # Obtener color favorito principal (primer color de la lista)
        color_favorito_principal = colores_procesados[0] if colores_procesados else '#a47968'
        
        # Obtener estilo frecuente (primer estilo de la lista)
        estilo_frecuente = estilos_fav[0] if estilos_fav else 'Casual'
        
        # Preparar datos para el template
        context = {
            'user': usuario,  # Para compatibilidad con el template
            'nombre_completo': usuario.nombre,
            'email': usuario.email,
            'iniciales': get_iniciales(usuario.nombre),
            'talla_superior': profile.talla_superior or 'XL',
            'talla_inferior': profile.talla_inferior or 'L', 
            'talla_calzado': profile.talla_calzado or '39',
            'estilos_fav': estilos_fav,
            'colores_fav': colores_procesados,
            'color_favorito_principal': color_favorito_principal,
            'estilo_frecuente': estilo_frecuente,
            'user_preferences': {  # Estructura adicional para compatibilidad
                'color_favorito': color_favorito_principal,
                'estilo_frecuente': estilo_frecuente,
                'talla_superior': profile.talla_superior or 'XL',
                'talla_inferior': profile.talla_inferior or 'L',
                'talla_calzado': profile.talla_calzado or '39',
                'estilos_favoritos': estilos_fav,
                'colores_favoritos': colores_procesados,
            }
        }
        
        # DEBUG: Ver qué datos se están enviando
        print(f"=== DEBUG SIDEFACE ===")
        print(f"Usuario: {usuario.nombre}")
        print(f"Email: {usuario.email}")
        print(f"Talla superior: {context['talla_superior']}")
        print(f"Talla inferior: {context['talla_inferior']}")
        print(f"Talla calzado: {context['talla_calzado']}")
        print(f"Estilos favoritos: {estilos_fav}")
        print(f"Colores favoritos: {colores_procesados}")
        print(f"Color favorito principal: {color_favorito_principal}")
        print(f"Estilo frecuente: {estilo_frecuente}")
        print("=====================")
        
        return render(request, 'sideface.html', context)
        
    except Usuario.DoesNotExist:
        messages.error(request, "Error: No se encontró tu perfil de usuario.")
        return redirect('login')
    except Profile.DoesNotExist:
        messages.error(request, "Error: No se encontró la configuración de tu perfil.")
        return redirect('configuracion_inicial')
    except Exception as e:
        print(f"Error al cargar el perfil: {e}")
        messages.error(request, "Hubo un error al cargar tu perfil.")
        # Pasar datos por defecto para que no se rompa el template
        context = {
            'nombre_completo': 'Usuario',
            'email': 'email@ejemplo.com',
            'iniciales': 'US',
            'talla_superior': 'XL',
            'talla_inferior': 'L',
            'talla_calzado': '39',
            'estilos_fav': ['Casual'],
            'colores_fav': ['#a47968'],
            'color_favorito_principal': '#a47968',
            'estilo_frecuente': 'Casual',
            'user_preferences': {
                'color_favorito': '#a47968',
                'estilo_frecuente': 'Casual',
                'talla_superior': 'XL',
                'talla_inferior': 'L',
                'talla_calzado': '39',
                'estilos_favoritos': ['Casual'],
                'colores_favoritos': ['#a47968'],
            }
        }
        return render(request, 'sideface.html', context)

def recomendar_outfit(request):
    ciudad = request.GET.get('ciudad', 'Morelia')
    modo = request.GET.get('modo', None)
    usuario_id = request.session.get('usuario_id')

    # --- Obtener perfil del usuario ---
    estilo = None
    temporada = None
    color = None
    if usuario_id:
        perfil = supabase.table("perfil_usuario").select("*").eq("id_Usuario", usuario_id).execute().data
        if perfil:
            estilo = perfil[0].get('estilo_favorito')
            temporada = perfil[0].get('temporada_favorita')
            color = perfil[0].get('color_favorito')

    # Si vienen parámetros en GET, tienen prioridad
    estilo = request.GET.get('estilo', estilo)
    temporada = request.GET.get('temporada', temporada)
    color = request.GET.get('color', color)

    # --- NUEVO: modo color inteligente ---
    modo_color = (modo == 'color' and color)

    # --- Lógica por CLIMA ---
    def obtener_clima(ciudad):
        API_KEY = '8a33fa8635d6adf10672a0fa18b68316'
        url = f'https://api.openweathermap.org/data/2.5/weather?q={ciudad}&appid={API_KEY}&units=metric&lang=es'
        try:
            resp = requests.get(url, timeout=5)
            data = resp.json()
            return {
                'temp': data.get('main', {}).get('temp'),
                'condicion': data.get('weather', [{}])[0].get('main', '').lower()
            }
        except Exception as e:
            print("Error al obtener clima:", e)
            return {'temp': None, 'condicion': None}

    clima = obtener_clima(ciudad)
    temp = clima['temp']

    def tipos_por_temperatura(temp):
        if temp is None:
            return []
        if temp < 10:
            return ['Abrigo', 'Bufanda', 'Camisa', 'Blusa', 'Suéter', 'Botas']
        elif temp < 18:
            return ['Chaqueta', 'Suéter', 'Bufanda', 'Camisa', 'Blusa', 'Zapatos formales', 'Zapatillas']
        elif temp < 25:
            return ['Camisa', 'Blusa', 'Pantalón', 'Zapatillas', 'Zapatos formales', 'Tenis deportivos', 'Mocasines']
        else:
            return ['Shorts', 'Falda', 'Vestido', 'Sandalias', 'Gafas de sol', 'Sombrero', 'Camisa', 'Blusa']

    tipos_clima = tipos_por_temperatura(temp)

    def obtener_prenda_por_tipo(tipos):
        prendas = []
        try:
            query = supabase.table("armario").select("*")
            if usuario_id:
                query = query.eq("idUsuario", usuario_id)

            # filtro estilo
            if estilo:
                query = query.ilike("estilo", f"%{estilo.lower()}%")

            # filtro temporada
            if temporada:
                query = query.ilike("temporada", f"%{temporada.lower()}%")

            # filtro color (modificado)
            if modo_color and color:
                query = query.eq("color", color)
            elif color:
                query = query.ilike("color", f"%{color.lower()}%")

            prendas = query.execute().data or []
        except Exception as e:
            print("Error al consultar Supabase:", e)

        return [p for p in prendas if 'tipo' in p and any(t.lower() in p['tipo'].lower() for t in tipos)]

    def filtrar_por_clima(lista):
        # Si ya tenemos suficientes prendas por gustos, no filtramos por clima
        if len(lista) >= 3:  
            return lista  # PRIORIDAD A ESTILO + TEMPORADA + COLOR

        # Si hay muy pocas prendas, entonces sí aplicamos clima
        return [p for p in lista if any(t.lower() in p['tipo'].lower() for t in tipos_clima)]


    vestidos = obtener_prenda_por_tipo(['Vestido'])
    partes_superiores = obtener_prenda_por_tipo(['Camisa', 'Blusa'])
    capas_externas = filtrar_por_clima(obtener_prenda_por_tipo(['Suéter', 'Chaqueta', 'Abrigo']))
    partes_inferiores = obtener_prenda_por_tipo(['Pantalón', 'Falda', 'Shorts', 'Traje'])
    calzados = filtrar_por_clima(obtener_prenda_por_tipo(['Zapatos formales', 'Tenis deportivos', 'Sandalias', 'Botas', 'Mocasines', 'Zapatillas']))
    accesorios_clima = filtrar_por_clima(obtener_prenda_por_tipo(['Bufanda', 'Gafas de sol']))
    otros_accesorios = obtener_prenda_por_tipo(['Bolso', 'Collar', 'Pulsera', 'Reloj', 'Sombrero', 'Cinturón', 'Cartera', 'Aretes'])

    accesorios = accesorios_clima + otros_accesorios

    tipos_deseados = ['Bolso', 'Collar', 'Pulsera', 'Reloj', 'Gafas de sol', 'Sombrero', 'Bufanda', 'Cinturón', 'Cartera']
    accesorios_por_tipo = {tipo: [] for tipo in tipos_deseados}
    for acc in accesorios:
        for tipo in tipos_deseados:
            if tipo.lower() in acc.get('tipo', '').lower():
                accesorios_por_tipo[tipo].append(acc)

    accesorios_seleccionados = {}
    if accesorios_por_tipo['Bufanda']:
        accesorios_seleccionados['Bufanda'] = random.choice(accesorios_por_tipo['Bufanda'])
    for tipo in ['Bolso', 'Cartera']:
        if accesorios_por_tipo[tipo]:
            accesorios_seleccionados['Bolso'] = random.choice(accesorios_por_tipo[tipo])
            break
    for tipo in tipos_deseados:
        if tipo in ['Bufanda', 'Bolso', 'Cartera']:
            continue
        if tipo == 'Collar' and 'Bufanda' in accesorios_seleccionados:
            continue
        if accesorios_por_tipo[tipo] and tipo not in accesorios_seleccionados:
            accesorios_seleccionados[tipo] = random.choice(accesorios_por_tipo[tipo])
    if not accesorios_seleccionados and accesorios:
        accesorios_seleccionados['Extra'] = random.choice(accesorios)

    usar_vestido = vestidos and random.choice([True, False])
    if usar_vestido:
        outfit = {
            'vestido': random.choice(vestidos),
            'calzado': random.choice(calzados) if calzados else None,
            'accesorios': accesorios_seleccionados
        }
    else:
        outfit = {
            'parte_superior_base': random.choice(partes_superiores) if partes_superiores else None,
            'parte_superior_externo': random.choice(capas_externas) if capas_externas else None,
            'parte_inferior': random.choice(partes_inferiores) if partes_inferiores else None,
            'calzado': random.choice(calzados) if calzados else None,
            'accesorios': accesorios_seleccionados
        }

    return render(request, 'outfit.html', {
        'outfit': outfit,
        'clima': clima,
        'estilo': estilo,
        'temporada': temporada,
        'color': color
    })


def opciones_filtro_api(request):
    modo = request.GET.get('modo')
    usuario_id = request.session.get('usuario_id')

    query = supabase.table("armario").select("*")
    if usuario_id:
        query = query.eq("idUsuario", usuario_id)
    prendas = query.execute().data

    if modo == 'estilo':
        opciones = sorted(set(p['estilo'] for p in prendas if p.get('estilo')))
    elif modo == 'temporada':
        opciones = sorted(set(p['temporada'] for p in prendas if p.get('temporada')))
    elif modo == 'color':
        opciones = sorted(set(p['color'] for p in prendas if p.get('color')))
    else:
        opciones = []

    return JsonResponse({'opciones': opciones})

def obtener_preferencias_por_valoracion(usuario_id):
    # Obtener solo las recomendaciones del usuario
    recomendaciones = Recomendacion.objects.filter(idUsuario=usuario_id)

    afinidad_colores = {}
    afinidad_estilos = {}
    afinidad_temporada = {}

    for rec in recomendaciones:
        # Cada rec.idOutfit apunta a un outfit calificado
        outfit = rec.idOutfit  

        # Sumamos puntajes según la valoración
        score = rec.valoracion or 0

        if outfit and score > 0:
            # Colores
            if outfit.color_principal:
                afinidad_colores[outfit.color_principal] = afinidad_colores.get(outfit.color_principal, 0) + score

            # Estilo
            if outfit.estilo:
                afinidad_estilos[outfit.estilo] = afinidad_estilos.get(outfit.estilo, 0) + score

            # Temporada
            if outfit.temporada:
                afinidad_temporada[outfit.temporada] = afinidad_temporada.get(outfit.temporada, 0) + score

    return afinidad_colores, afinidad_estilos, afinidad_temporada
@csrf_exempt
@require_POST
def guardar_outfit(request):
    if request.method == 'POST':
        print("=== INICIANDO GUARDADO DE OUTFIT ===")
        
        if 'usuario_id' not in request.session:
            return JsonResponse({'error': 'Usuario no autenticado.'}, status=401)

        try:
            usuario_id = request.session['usuario_id']
            usuario = Usuario.objects.get(idUsuario=usuario_id)
            print(f"✅ Usuario: {usuario.nombre} (ID: {usuario_id})")

            # Obtener datos básicos
            estilo = request.POST.get('estilo', 'Personalizado')
            clima = request.POST.get('clima_recomendado', 'Templado')
            
            print(f"📝 Estilo: {estilo}")
            print(f"🌤️ Clima: {clima}")

            # DEBUG: Ver TODO lo que viene en el POST
            print("📨 DATOS POST RECIBIDOS:")
            for key, values in request.POST.lists():
                print(f"   {key}: {values}")

            # Obtener listas de prendas - FORMA CORRECTA
            imagenes = request.POST.getlist('imagenes')
            tipos = request.POST.getlist('tipos')
            
            print(f"👕 Imágenes recibidas: {len(imagenes)}")
            print(f"🏷️ Tipos recibidos: {len(tipos)}")
            
            # Mostrar cada prenda individualmente
            for i, (url, tipo) in enumerate(zip(imagenes, tipos)):
                print(f"   Prenda {i+1}: {tipo} -> {url[:80]}...")

            if not imagenes or not tipos:
                error_msg = f'No se recibieron prendas. Imágenes: {len(imagenes)}, Tipos: {len(tipos)}'
                print(f"❌ {error_msg}")
                return JsonResponse({'error': error_msg}, status=400)

            if len(imagenes) != len(tipos):
                error_msg = f'Cantidad no coincide: {len(imagenes)} imágenes vs {len(tipos)} tipos'
                print(f"❌ {error_msg}")
                return JsonResponse({'error': error_msg}, status=400)

            # 1. CREAR OUTFIT
            nuevo_outfit = Outfit.objects.create(
                idUsuario=usuario,
                estilo=estilo,
                clima_recomendado=clima,
                fecha_creacion=datetime.now(),
                esFavorito=False
            )
            print(f"✅ Outfit creado: ID {nuevo_outfit.idOutfit}")

            # 2. GUARDAR PRENDAS - FORMA CORREGIDA
            prendas_guardadas = 0
            for i, (url, tipo) in enumerate(zip(imagenes, tipos)):
                if url and tipo and url.strip() and tipo.strip():
                    try:
                        # Verificar que la URL sea válida
                        if url.startswith('http'):
                            VerPrenda.objects.create(
                                outfit=nuevo_outfit,
                                imagen_url=url.strip(),
                                tipo_prenda=tipo.strip()
                            )
                            prendas_guardadas += 1
                            print(f"✅ Prenda {i+1} guardada: {tipo.strip()}")
                        else:
                            print(f"⚠️ URL inválida omitida: {url[:50]}...")
                    except Exception as e:
                        print(f"❌ Error guardando prenda {i+1}: {str(e)}")
                else:
                    print(f"⚠️ Prenda {i+1} omitida - datos vacíos")

            print(f"📊 Total de prendas guardadas: {prendas_guardadas}")

            # 3. CREAR RECOMENDACIÓN
            recomendacion = Recomendacion.objects.create(
                idUsuario=usuario,
                idOutfit=nuevo_outfit,
                clima_del_dia=clima,
                valoracion=0
            )
            print(f"✅ Recomendación creada: ID {recomendacion.idRecomendacion}")

            # Verificar que las prendas se guardaron
            prendas_verificadas = VerPrenda.objects.filter(outfit=nuevo_outfit).count()
            print(f"🔍 Verificación: {prendas_verificadas} prendas en la base de datos")

            return JsonResponse({
                'success': True,
                'message': 'Outfit guardado exitosamente.',
                'outfit_id': nuevo_outfit.idOutfit,
                'recomendacion_id': recomendacion.idRecomendacion,
                'total_prendas': prendas_guardadas,
                'prendas_verificadas': prendas_verificadas
            }, status=200)

        except Exception as e:
            error_msg = f"Error interno: {str(e)}"
            print(f"❌ {error_msg}")
            import traceback
            print(traceback.format_exc())
            return JsonResponse({'error': error_msg}, status=500)

    return JsonResponse({'error': 'Método no permitido'}, status=400)
# ---------------------------------------------------------------------------------
# 5. CONFIGURACIÓN DEL ASISTENTE (WIZARD)
# ---------------------------------------------------------------------------------

# 1. Define la secuencia de pasos
FORMS = [
    ("estilos", EstiloForm),
    ("colores", ColorForm),
    ("estaciones", EstacionForm),
    ("tallas", TallaForm), 
]

# 2. Define las plantillas usando TUS NOMBRES DE ARCHIVO
TEMPLATES = {
    "estilos": "styleinitial.html",     
    "colores": "colorsinitial.html",    
    "estaciones": "stationinitial.html",  
    "tallas": "sizeinitial.html",       
}

# En tu views.py - CORRIGE el método done del ConfiguracionWizard

class ConfiguracionWizard(SessionWizardView):
    
    def get_template_names(self):
        return [TEMPLATES[self.steps.current]]
        
    def done(self, form_list, **kwargs):
        data = self.get_all_cleaned_data()
        
        # CORRECCIÓN: Obtener el usuario de la SESIÓN, no de request.user
        usuario_id = self.request.session.get('usuario_id')
        if not usuario_id:
            messages.error(self.request, "Debes iniciar sesión para completar la configuración.")
            return redirect('login')
        
        try:
            # Usar tu modelo Usuario personalizado
            user_instance = Usuario.objects.get(idUsuario=usuario_id)
            profile = Profile.objects.get(user=user_instance)
        except (Usuario.DoesNotExist, Profile.DoesNotExist):
            messages.error(self.request, "Error: No se encontró tu perfil.")
            return redirect('login') 

        # Guardar los datos
        profile.estilos = data.get('estilos', [])
        profile.colores_fav = data.get('colores_fav', [])
        profile.temporadas_fav = data.get('temporadas_fav', [])
        
        # Tallas
        profile.talla_superior = data.get('talla_superior')
        profile.talla_inferior = data.get('talla_inferior')
        profile.talla_calzado = data.get('talla_calzado')
        
        # Marcar como completo y guardar
        profile.config_completada = True
        profile.save()

        # Mensaje de éxito
        messages.success(self.request, "¡Configuración completada! Bienvenido a tu armario digital.")

        # Redirigir al dashboard/inicio
        return redirect('dashboard')  # Asegúrate que esta URL existe
    
@csrf_exempt
def guardar_rating(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            rating = data.get("rating")
            id_usuario = data.get("idUsuario")
            id_outfit = data.get("idOutfit")

            if not rating or not id_usuario or not id_outfit:
                return JsonResponse({"error": "Faltan datos"}, status=400)

            usuario = Usuario.objects.get(idUsuario=id_usuario)
            outfit = Outfit.objects.get(idOutfit=id_outfit)

            Recomendacion.objects.create(
                idUsuario=usuario,
                idOutfit=outfit,
                valoracion=int(rating),
                clima_del_dia="N/A"
            )

            return JsonResponse({"mensaje": "Valoración guardada correctamente"})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def segmentar_prenda(request):
    """
    Vista para aplicar segmentación REAL a las imágenes de prendas usando rembg
    """
    if request.method == 'POST' and request.FILES.get('imagen'):
        try:
            if 'usuario_id' not in request.session:
                return JsonResponse({
                    'success': False,
                    'error': 'Usuario no autenticado'
                }, status=401)
            
            imagen = request.FILES['imagen']
            usuario_id = request.session['usuario_id']
            
            # Obtener el ID de la prenda desde los datos de sesión o parámetros
            prenda_id = request.POST.get('prenda_id')
            
            # ✅ USAR REMBG REAL PARA QUITAR EL FONDO
            imagen_segmentada = aplicar_rembg_real(imagen)
            
            if not imagen_segmentada:
                return JsonResponse({
                    'success': False,
                    'error': 'Error al procesar la imagen con rembg'
                }, status=500)
            
            # SUBIR IMAGEN SEGMENTADA A SUPABASE
            file_ext = '.png'
            unique_filename = f'segmentada_{usuario_id}_{uuid.uuid4()}{file_ext}'
            path_on_storage = f'prendas_segmentadas/{unique_filename}'
            
            # Convertir imagen a bytes para subir a Supabase
            buffer = io.BytesIO()
            imagen_segmentada.save(buffer, format='PNG')
            file_content = buffer.getvalue()
            
            # Subir a Supabase
            upload_response = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
                file=file_content,
                path=path_on_storage,
                file_options={"content-type": "image/png"}
            )
            
            # Obtener URL pública
            public_url_response = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(path_on_storage)
            image_segmentada_url = public_url_response
            
            # Convertir la imagen segmentada a base64 para enviar al frontend
            imagen_segmentada_base64 = base64.b64encode(file_content).decode('utf-8')
            
            # GUARDAR EN LA BASE DE DATOS - ESTRATEGIA MEJORADA
            try:
                usuario = Usuario.objects.get(idUsuario=usuario_id)
                
                # ESTRATEGIA 1: Buscar por prenda_id si está disponible
                if prenda_id:
                    try:
                        prenda = Armario.objects.get(idPrenda=prenda_id, idUsuario=usuario)
                        prenda.imagen_segmentada = image_segmentada_url
                        prenda.save()
                        print(f"✅ Estrategia 1 - Imagen segmentada guardada para prenda ID: {prenda.idPrenda}")
                    except Armario.DoesNotExist:
                        print(f"⚠️ No se encontró prenda con ID: {prenda_id}")
                        # Continuar con estrategia 2
                
                # ESTRATEGIA 2: Buscar la última prenda del usuario (más reciente)
                if not prenda_id:
                    ultima_prenda = Armario.objects.filter(idUsuario=usuario).order_by('-fecha', '-idPrenda').first()
                    if ultima_prenda and not ultima_prenda.imagen_segmentada:
                        ultima_prenda.imagen_segmentada = image_segmentada_url
                        ultima_prenda.save()
                        print(f"✅ Estrategia 2 - Imagen segmentada guardada para prenda ID: {ultima_prenda.idPrenda}")
                        prenda_id = ultima_prenda.idPrenda
                    elif ultima_prenda:
                        print(f"⚠️ La prenda {ultima_prenda.idPrenda} ya tiene imagen segmentada")
                    else:
                        print("❌ No se encontró ninguna prenda para este usuario")
                        
            except Exception as db_error:
                print(f"❌ ERROR DB al guardar segmentación: {db_error}")
                # No retornes error aquí para no interrumpir el flujo
            
            return JsonResponse({
                'success': True,
                'segmented_image': f"data:image/png;base64,{imagen_segmentada_base64}",
                'segmented_image_url': image_segmentada_url,
                'prenda_id': prenda_id,
                'message': 'Fondo removido exitosamente'
            })
            
        except Exception as e:
            print(f"❌ Error en segmentar_prenda: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'error': 'No se proporcionó imagen para segmentar'
    }, status=400)

def aplicar_rembg_real(imagen):
    """
    Función REAL que usa rembg para quitar el fondo
    """
    try:
        # Leer la imagen
        input_image = Image.open(imagen)
        
        # ✅ USAR REMBG PARA QUITAR EL FONDO
        output_image = remove(input_image)
        
        # Crear una nueva imagen con fondo transparente o blanco
        # rembg ya devuelve la imagen con fondo transparente por defecto
        # Pero podemos opcionalmente poner fondo blanco si prefieres
        if output_image.mode in ('RGBA', 'LA'):
            # Crear fondo blanco
            background = Image.new('RGB', output_image.size, (255, 255, 255))
            # Pegar la imagen sin fondo sobre el fondo blanco
            background.paste(output_image, mask=output_image.split()[-1])  # Usar el canal alpha como máscara
            output_image = background
        
        return output_image
        
    except Exception as e:
        print(f"❌ Error en aplicar_rembg_real: {e}")
        # Fallback: devolver la imagen original
        return Image.open(imagen)

def simular_segmentacion(imagen):
    """
    Función mejorada que simula la segmentación
    En producción, reemplaza esto con tu modelo de ML real
    """
    try:
        # Abrir la imagen original
        img = Image.open(imagen)
        
        # Convertir a RGB si es necesario
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Crear una versión "segmentada" más realista
        width, height = img.size
        
        # Crear una nueva imagen con fondo blanco
        segmented = Image.new('RGB', (width, height), color='white')
        
        # Redimensionar la imagen original para hacerla más pequeña (simular segmentación)
        # Esto es solo para demostración - en realidad usarías tu modelo
        scale_factor = 0.7
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Pegar la imagen redimensionada en el centro del fondo blanco
        x_offset = (width - new_width) // 2
        y_offset = (height - new_height) // 2
        segmented.paste(resized_img, (x_offset, y_offset))
        
        # Aplicar un borde para simular mejor la segmentación
        from PIL import ImageDraw
        draw = ImageDraw.Draw(segmented)
        draw.rectangle([x_offset-2, y_offset-2, x_offset+new_width+2, y_offset+new_height+2], 
                      outline="#5d9e9e", width=4)
        
        return segmented
        
    except Exception as e:
        print(f"Error en simular_segmentacion: {e}")
        # Fallback: devolver la imagen original
        return Image.open(imagen)
    
    

def ayuda_contacto(request):
    return render(request, 'help.html')

@configuracion_requerida
def configuration_system(request):
    """Vista principal del sistema de configuración"""
    try:
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        
        context = {
            'usuario': usuario,
            'active_tab': 'general'
        }
        return render(request, 'configurationsystem.html', context)
        
    except (KeyError, Usuario.DoesNotExist):
        messages.error(request, "Debes iniciar sesión para acceder a la configuración.")
        return redirect('login')
    
    
def calendar_view(request, year=None, month=None):
    # Si no se especifica mes/año, usar el actual
    today = date.today()
    if year is None or month is None:
        year = today.year
        month = today.month

    year = int(year)
    month = int(month)

    # Nombre del mes
    month_name = calendar.month_name[month]

    # Crear matriz del calendario
    cal = calendar.Calendar(firstweekday=6)  # 6 = domingo como primer día
    month_days = cal.monthdatescalendar(year, month)

    # Crear estructura para enviarla al template
    weeks = []
    for week in month_days:
        week_data = []
        for day in week:
            week_data.append({
                "date": day,
                "in_month": day.month == month
            })
        weeks.append(week_data)

    # Calcular mes anterior y siguiente
    if month == 1:
        prev_month = date(year-1, 12, 1)
        next_month = date(year, 2, 1)
    elif month == 12:
        prev_month = date(year, 11, 1)
        next_month = date(year+1, 1, 1)
    else:
        prev_month = date(year, month-1, 1)
        next_month = date(year, month+1, 1)

    # ✅ CORREGIDO: Obtener usuario usando tu sistema de sesión personalizado
    user_authenticated = False
    user_email = ""
    user_events = []
    
    if 'usuario_id' in request.session:
        try:
            usuario_id = request.session['usuario_id']
            usuario = Usuario.objects.get(idUsuario=usuario_id)
            user_authenticated = True
            user_email = usuario.email
            user_events = CalendarEventos.objects.filter(id_usuario=usuario)
        except Usuario.DoesNotExist:
            pass

    context = {
        "year": year,
        "month": month,
        "month_name": month_name,
        "weeks": weeks,
        "prev_year": prev_month.year,
        "prev_month": prev_month.month,
        "next_year": next_month.year,
        "next_month": next_month.month,
        "today": today,
        "user_events": user_events,
        # ✅ Añadir estas variables para el template
        "user": {
            "is_authenticated": user_authenticated,
            "email": user_email
        }
    }

    return render(request, "calendar.html", context)

@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def calendar_events_api(request):
    # ✅ CORREGIDO: Usar tu sistema de autenticación personalizado
    if 'usuario_id' not in request.session:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    try:
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    
    if request.method == 'GET':
        # Obtener eventos del usuario
        events = CalendarEventos.objects.filter(id_usuario=usuario)
        events_data = []
        for event in events:
            events_data.append({
                'id': event.id,
                'event_date': event.event_date.isoformat() if event.event_date else None,
                'event_title': event.event_title,
                'event_outfit': event.event_outfit,
                'event_location': event.event_location,
                'event_description': event.event_description,
                'created_at': event.created_at.isoformat() if event.created_at else None,
                'updated_at': event.updated_at.isoformat() if event.updated_at else None,
            })
        return JsonResponse(events_data, safe=False)
    
    elif request.method == 'POST':
        # Crear nuevo evento
        try:
            data = json.loads(request.body)
            print(f"🎯 DEBUG BACKEND - Fecha recibida del frontend: {data.get('event_date')}")
            print(f"🎯 DEBUG BACKEND - Datos completos: {data}")
            
            # ✅ CORRECCIÓN: Convertir la fecha correctamente
            event_date_str = data.get('event_date')
            if event_date_str:
                # Parsear la fecha manualmente para evitar problemas de timezone
                from datetime import datetime
                event_date = datetime.strptime(event_date_str, '%Y-%m-%d').date()
                print(f"📅 Fecha parseada: {event_date}")
            else:
                event_date = None
            
            event = CalendarEventos.objects.create(
                id_usuario=usuario,
                event_date=event_date,  # ✅ Usar la fecha convertida
                event_title=data.get('event_title', ''),
                event_outfit=data.get('event_outfit'),
                event_location=data.get('event_location'),
                event_description=data.get('event_description'),
            )
            
            print(f"✅ DEBUG BACKEND - Evento creado con fecha: {event.event_date}")
            print(f"✅ DEBUG BACKEND - Evento ID: {event.id}")
            print(f"🔍 DEBUG BACKEND - Tipo de fecha guardada: {type(event.event_date)}")
            
            return JsonResponse({
                'id': event.id,
                'message': 'Event created successfully'
            }, status=201)
        except Exception as e:
            print(f"❌ DEBUG BACKEND - Error: {str(e)}")
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == 'PUT':
        # Actualizar evento
        try:
            data = json.loads(request.body)
            event_id = data.get('id')
            event = get_object_or_404(CalendarEventos, id=event_id, id_usuario=usuario)
            
            # ✅ CORRECCIÓN: Convertir la fecha también en el UPDATE
            event_date_str = data.get('event_date')
            if event_date_str:
                from datetime import datetime
                event_date = datetime.strptime(event_date_str, '%Y-%m-%d').date()
                event.event_date = event_date
            else:
                event.event_date = data.get('event_date', event.event_date)
                
            event.event_title = data.get('event_title', event.event_title)
            event.event_outfit = data.get('event_outfit', event.event_outfit)
            event.event_location = data.get('event_location', event.event_location)
            event.event_description = data.get('event_description', event.event_description)
            event.save()
            
            return JsonResponse({'message': 'Event updated successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        # Eliminar evento
        try:
            data = json.loads(request.body)
            event_id = data.get('id')
            event = get_object_or_404(CalendarEventos, id=event_id, id_usuario=usuario)
            event.delete()
            return JsonResponse({'message': 'Event deleted successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

# Vista para el calendario sin parámetros (mes actual)
def calendar_current(request):
    return calendar_view(request)

#mostrar ootds

@configuracion_requerida
def outfits_recommendations(request):
    """Vista principal para mostrar recomendaciones de outfits"""
    try:
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        
        context = {
            'usuario': usuario,
            'page_title': 'Recomendaciones de Outfits'
        }
        return render(request, 'saveootd.html', context)
        
    except (KeyError, Usuario.DoesNotExist):
        messages.error(request, "Debes iniciar sesión para ver las recomendaciones.")
        return redirect('login')
    
@login_required
def save_look(request):
    """Vista para guardar un look (API)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            look_name = data.get('look_name')
            look_category = data.get('look_category')
            
            # Aquí guardarías en tu modelo o Supabase
            # Ejemplo con modelo Django:
            # saved_look = SavedLook.objects.create(
            #     user=request.user,
            #     name=look_name,
            #     category=look_category
            # )
            
            # Por ahora simulamos el guardado
            return JsonResponse({
                'success': True,
                'message': f'Look "{look_name}" guardado correctamente'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al guardar: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})

@login_required
def remove_look(request):
    """Vista para eliminar un look guardado (API)"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            look_name = data.get('look_name')
            
            # Aquí eliminarías de tu modelo o Supabase
            # Ejemplo con modelo Django:
            # SavedLook.objects.filter(user=request.user, name=look_name).delete()
            
            return JsonResponse({
                'success': True,
                'message': f'Look "{look_name}" eliminado correctamente'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al eliminar: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})

@login_required
def get_saved_looks(request):
    """Vista para obtener looks guardados del usuario"""
    if request.method == 'GET':
        try:
            # Aquí obtendrías los looks guardados de tu modelo o Supabase
            # Ejemplo con modelo Django:
            # saved_looks = SavedLook.objects.filter(user=request.user).values('name', 'category')
            # looks_list = list(saved_looks)
            
            # Por ahora devolvemos datos de ejemplo
            looks_list = []  # Esto vendría de tu base de datos
            
            return JsonResponse({
                'success': True,
                'saved_looks': looks_list
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al obtener looks: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Método no permitido'})

# REEMPLAZA completamente la vista 'obtener_recomendaciones_guardadas' con esta versión:
@configuracion_requerida
def obtener_recomendaciones_guardadas(request):
    """Obtener las recomendaciones con sus prendas - VERSIÓN CORREGIDA"""
    try:
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        
        print(f"🔍 Buscando recomendaciones para usuario: {usuario_id}")

        # Obtener TODAS las recomendaciones del usuario
        recomendaciones = Recomendacion.objects.filter(idUsuario=usuario_id)
        
        print(f"📊 Recomendaciones encontradas: {recomendaciones.count()}")

        recomendaciones_data = []
        for rec in recomendaciones:
            print(f"  Procesando recomendación ID: {rec.idRecomendacion}")
            print(f"  Outfit ID: {rec.idOutfit.idOutfit}")
            
            # Obtener prendas del outfit
            prendas_outfit = VerPrenda.objects.filter(outfit=rec.idOutfit)
            print(f"  Prendas encontradas: {prendas_outfit.count()}")

            # Procesar información de cada prenda
            prendas_detalladas = []
            for prenda in prendas_outfit:
                prendas_detalladas.append({
                    'tipo': prenda.tipo_prenda,
                    'imagen_url': prenda.imagen_url
                })
                print(f"    - {prenda.tipo_prenda}: {prenda.imagen_url[:50]}...")

            # Imagen principal (primera prenda)
            imagen_principal = prendas_outfit.first().imagen_url if prendas_outfit.exists() else ''

            recomendaciones_data.append({
                'id': rec.idRecomendacion,
                'outfit_id': rec.idOutfit.idOutfit,
                'nombre': f"Look {rec.idOutfit.estilo}",
                'categoria': rec.idOutfit.estilo,
                'estilo': rec.idOutfit.estilo,
                'clima': rec.clima_del_dia,
                'imagen_url': imagen_principal,
                'fecha_creacion': rec.fecha_generacion.strftime('%d/%m/%Y'),
                'valoracion': rec.valoracion or 0,
                'es_favorito': rec.idOutfit.esFavorito,
                'prendas': prendas_detalladas,
                'total_prendas': len(prendas_detalladas)
            })

        print(f"✅ Enviando {len(recomendaciones_data)} recomendaciones")
        
        return JsonResponse({
            'success': True,
            'recomendaciones': recomendaciones_data
        })
        
    except Exception as e:
        print(f"❌ ERROR en obtener_recomendaciones_guardadas: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': str(e)
        })
# AGREGA esta vista NUEVA al final de views.py
@configuracion_requerida
def obtener_prendas_outfit(request, outfit_id):
    """Obtener las prendas específicas de un outfit"""
    try:
        usuario_id = request.session['usuario_id']
        
        # Verificar que el outfit pertenece al usuario
        outfit = Outfit.objects.get(idOutfit=outfit_id, idUsuario=usuario_id)
        prendas = VerPrenda.objects.filter(outfit=outfit)
        
        prendas_data = []
        for prenda in prendas:
            prendas_data.append({
                'tipo': prenda.tipo_prenda,
                'imagen_url': prenda.imagen_url,
                'descripcion': f"{prenda.tipo_prenda} - {outfit.estilo}"
            })
        
        return JsonResponse({
            'success': True,
            'prendas': prendas_data,
            'outfit_nombre': f"Look {outfit.estilo}",
            'total_prendas': len(prendas_data)
        })
        
    except Outfit.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Outfit no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
        
@csrf_exempt
@require_POST
def guardar_valoracion(request):
    """Guardar valoración de una recomendación"""
    try:
        if 'usuario_id' not in request.session:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado'}, status=401)
        
        data = json.loads(request.body)
        recomendacion_id = data.get('recomendacion_id')
        valoracion = data.get('valoracion')
        
        if not recomendacion_id or not valoracion:
            return JsonResponse({'success': False, 'error': 'Datos incompletos'}, status=400)
        
        usuario_id = request.session['usuario_id']
        
        # Verificar que la recomendación pertenece al usuario
        recomendacion = Recomendacion.objects.get(
            idRecomendacion=recomendacion_id,
            idUsuario=usuario_id
        )
        
        recomendacion.valoracion = valoracion
        recomendacion.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Valoración guardada correctamente'
        })
        
    except Recomendacion.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Recomendación no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
# En views.py - AGREGAR esta vista temporal
@configuracion_requerida
def ver_outfits_guardados(request):
    """Vista temporal para verificar outfits guardados"""
    usuario_id = request.session['usuario_id']
    usuario = Usuario.objects.get(idUsuario=usuario_id)
    
    outfits = Outfit.objects.filter(idUsuario=usuario).order_by('-fecha_creacion')
    outfits_data = []
    
    for outfit in outfits:
        prendas = VerPrenda.objects.filter(outfit=outfit)
        outfits_data.append({
            'id': outfit.idOutfit,
            'estilo': outfit.estilo,
            'fecha': outfit.fecha_creacion.strftime('%Y-%m-%d %H:%M'),
            'prendas_count': prendas.count(),
            'prendas': [
                {
                    'tipo': p.tipo_prenda,
                    'imagen_url': p.imagen_url,
                    'url_length': len(p.imagen_url)
                } for p in prendas
            ]
        })
    
    return JsonResponse({
        'success': True,
        'total_outfits': len(outfits_data),
        'outfits': outfits_data
    })
    

# TEMPORAL: Quita el decorator para debugging
def debug_outfit(request, outfit_id):
    """Vista temporal para debuguear un outfit específico"""
    try:
        # Verificación básica de sesión
        if 'usuario_id' not in request.session:
            return JsonResponse({'success': False, 'error': 'No autenticado'})
            
        usuario_id = request.session['usuario_id']
        outfit = Outfit.objects.get(idOutfit=outfit_id, idUsuario=usuario_id)
        prendas = VerPrenda.objects.filter(outfit=outfit)
        
        prendas_data = []
        for prenda in prendas:
            prendas_data.append({
                'id': prenda.id,
                'tipo': prenda.tipo_prenda,
                'imagen_url': prenda.imagen_url,
                'url_valida': prenda.imagen_url.startswith('http') if prenda.imagen_url else False,
                'url_length': len(prenda.imagen_url) if prenda.imagen_url else 0
            })
        
        return JsonResponse({
            'success': True,
            'outfit': {
                'id': outfit.idOutfit,
                'estilo': outfit.estilo,
                'clima': outfit.clima_recomendado,
                'fecha': outfit.fecha_creacion.strftime('%Y-%m-%d %H:%M')
            },
            'prendas': prendas_data,
            'total_prendas': len(prendas_data),
            'debug': 'Vista de debug temporal'
        })
        
    except Outfit.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Outfit no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    
# Vista temporal para ver todos los outfits del usuario
def debug_all_outfits(request):
    if 'usuario_id' not in request.session:
        return JsonResponse({'success': False, 'error': 'No autenticado'})
    
    try:
        usuario_id = request.session['usuario_id']
        
        # Buscar TODOS los outfits del usuario
        outfits = Outfit.objects.filter(idUsuario=usuario_id).order_by('-fecha_creacion')
        print(f"🔍 Outfits encontrados para usuario {usuario_id}: {outfits.count()}")

        outfits_data = []
        for outfit in outfits:
            prendas = VerPrenda.objects.filter(outfit=outfit)
            print(f"  Outfit {outfit.idOutfit}: {prendas.count()} prendas")
            
            outfits_data.append({
                'outfit_id': outfit.idOutfit,
                'estilo': outfit.estilo,
                'clima': outfit.clima_recomendado,
                'fecha': outfit.fecha_creacion.strftime('%Y-%m-%d %H:%M'),
                'total_prendas': prendas.count(),
                'prendas': [
                    {
                        'tipo': p.tipo_prenda,
                        'imagen_url': p.imagen_url,
                        'url_length': len(p.imagen_url)
                    } for p in prendas
                ]
            })

        return JsonResponse({
            'success': True,
            'total_outfits': len(outfits_data),
            'outfits': outfits_data
        })
        
    except Exception as e:
        print(f"❌ ERROR en debug_all_outfits: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)})
    

@configuracion_requerida
def ver_prendas_temp(request):
    """Página para ver las prendas y outfits - CON RESTRICCIONES"""
    if 'usuario_id' not in request.session:
        return redirect('login')
    
    return render(request, 'ver_prendas_temp.html')

@csrf_exempt
@require_POST
@configuracion_requerida
def eliminar_cuenta(request):
    """Eliminar permanentemente la cuenta del usuario y todos sus datos"""
    try:
        usuario_id = request.session.get('usuario_id')
        if not usuario_id:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado.'}, status=401)

        # Obtener el usuario
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        
        print(f"🗑️ Iniciando eliminación de cuenta para usuario: {usuario.email}")

        # 1. ELIMINAR PRENDAS DEL ARMARIO (y sus imágenes de Supabase)
        prendas = Armario.objects.filter(idUsuario=usuario)
        print(f"📦 Eliminando {prendas.count()} prendas del armario...")
        
        for prenda in prendas:
            try:
                # Eliminar imagen de Supabase si existe
                if prenda.imagen:
                    try:
                        image_path = prenda.imagen.split('/storage/v1/object/public/')[1]
                        supabase.storage.from_(SUPABASE_STORAGE_BUCKET).remove([image_path])
                        print(f"✅ Imagen eliminada de Supabase: {image_path}")
                    except Exception as e:
                        print(f"⚠️ No se pudo eliminar imagen de Supabase: {e}")
                
                # Eliminar imagen segmentada si existe
                if prenda.imagen_segmentada:
                    try:
                        seg_path = prenda.imagen_segmentada.split('/storage/v1/object/public/')[1]
                        supabase.storage.from_(SUPABASE_STORAGE_BUCKET).remove([seg_path])
                        print(f"✅ Imagen segmentada eliminada de Supabase: {seg_path}")
                    except Exception as e:
                        print(f"⚠️ No se pudo eliminar imagen segmentada: {e}")
                        
            except Exception as e:
                print(f"⚠️ Error procesando prenda {prenda.idPrenda}: {e}")
        
        # Eliminar registros de la base de datos
        prendas.delete()
        print("✅ Prendas eliminadas de la base de datos")

        # 2. ELIMINAR OUTFITS Y RECOMENDACIONES
        outfits = Outfit.objects.filter(idUsuario=usuario)
        print(f"👗 Eliminando {outfits.count()} outfits...")
        
        for outfit in outfits:
            # Eliminar prendas del outfit
            VerPrenda.objects.filter(outfit=outfit).delete()
            # Eliminar recomendaciones asociadas
            Recomendacion.objects.filter(idOutfit=outfit).delete()
        
        outfits.delete()
        print("✅ Outfits y recomendaciones eliminados")

        # 3. ELIMINAR EVENTOS DEL CALENDARIO
        eventos = CalendarEventos.objects.filter(id_usuario=usuario)
        print(f"📅 Eliminando {eventos.count()} eventos del calendario...")
        eventos.delete()
        print("✅ Eventos del calendario eliminados")

        # 4. ELIMINAR PERFIL
        try:
            profile = Profile.objects.get(user=usuario)
            profile.delete()
            print("✅ Perfil eliminado")
        except Profile.DoesNotExist:
            print("ℹ️ No se encontró perfil para eliminar")
        except Profile.MultipleObjectsReturned:
            # Si hay múltiples perfiles, eliminar todos
            Profile.objects.filter(user=usuario).delete()
            print("✅ Múltiples perfiles eliminados")

        # 5. ELIMINAR USUARIO
        email_usuario = usuario.email
        usuario.delete()
        print(f"✅ Usuario {email_usuario} eliminado de la base de datos")

        # 6. LIMPIAR SESIÓN
        if 'usuario_id' in request.session:
            del request.session['usuario_id']
        if 'usuario_nombre' in request.session:
            del request.session['usuario_nombre']
        
        request.session.flush()
        print("✅ Sesión limpiada")

        # 7. Cerrar sesión de Django también por seguridad
        logout(request)

        return JsonResponse({
            'success': True,
            'message': 'Cuenta eliminada permanentemente. Todos tus datos han sido borrados.'
        })

    except Usuario.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Usuario no encontrado.'}, status=404)
    except Exception as e:
        print(f"❌ ERROR CRÍTICO al eliminar cuenta: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False, 
            'error': f'Error al eliminar la cuenta: {str(e)}'
        }, status=500)
        
        
@configuracion_requerida
def api_outfits_favoritos(request):
    if 'usuario_id' not in request.session:
        return JsonResponse({'success': False, 'error': 'No autenticado'}, status=401)

    usuario_id = request.session['usuario_id']
    try:
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        outfits = Outfit.objects.filter(idUsuario=usuario, favorito=True).order_by('-fecha_creacion')

        outfits_data = []
        for outfit in outfits:
            prendas = VerPrenda.objects.filter(outfit=outfit)
            outfits_data.append({
                'id': outfit.idOutfit,
                'estilo': outfit.estilo,
                'clima': outfit.clima_recomendado,
                'fecha': outfit.fecha_creacion.strftime('%Y-%m-%d %H:%M'),
                'prendas_count': prendas.count(),
                'prendas': [
                    {
                        'tipo': p.tipo_prenda,
                        'imagen_url': p.imagen_url,
                        'url_length': len(p.imagen_url) if p.imagen_url else 0
                    } for p in prendas
                ]
            })

        return JsonResponse({'success': True, 'total_favoritos': len(outfits_data), 'outfits': outfits_data})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
@configuracion_requerida
def ver_outfits_favoritos(request):
    if 'usuario_id' not in request.session:
        return redirect('login')
    return render(request, 'outfits_favoritos.html')


def toggle_favorito(request, outfit_id):
    try:
        outfit = Outfit.objects.get(id=outfit_id, usuario=request.user)
        outfit.es_favorito = not outfit.es_favorito
        outfit.save()
        return JsonResponse({'success': True, 'es_favorito': outfit.es_favorito})
    except Outfit.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Outfit no encontrado'}, status=404)

def google_login(request):
    """Inicia el flujo de autenticación con Google"""
    try:
        auth_url, state = GoogleOAuth.get_auth_url()
        # Guarda el estado en la sesión para verificación posterior
        request.session['google_auth_state'] = state
        print(f"🔗 URL de autenticación generada: {auth_url}")
        return HttpResponseRedirect(auth_url)
    except Exception as e:
        print(f"❌ Error en google_login: {e}")
        import traceback
        traceback.print_exc()
        messages.error(request, "Error al iniciar sesión con Google")
        return redirect('login')

def google_auth_callback(request):
    """Maneja la respuesta de Google OAuth"""
    try:
        print("🔄 Procesando callback de Google...")
        
        # Verifica que el estado coincida
        state = request.GET.get('state', '')
        saved_state = request.session.get('google_auth_state', '')
        
        print(f"🔍 Estado recibido: {state}")
        print(f"🔍 Estado guardado: {saved_state}")
        
        if not state or state != saved_state:
            messages.error(request, "Error de seguridad en la autenticación")
            print("❌ Error: Estado no coincide")
            return redirect('login')
        
        # Obtiene el código de autorización
        code = request.GET.get('code')
        error = request.GET.get('error')
        
        if error:
            messages.error(request, f"Error de Google: {error}")
            print(f"❌ Error de Google: {error}")
            return redirect('login')
        
        if not code:
            messages.error(request, "No se recibió el código de autorización")
            print("❌ No se recibió código")
            return redirect('login')
        
        print(f"✅ Código recibido: {code[:20]}...")
        
        # Intercambia el código por un token
        try:
            flow = GoogleOAuth.get_flow()
            flow.fetch_token(code=code)
            credentials = flow.credentials
            print("✅ Token obtenido exitosamente")
        except Exception as e:
            print(f"❌ Error obteniendo token: {e}")
            messages.error(request, "Error al obtener el token de acceso")
            return redirect('login')
        
        # Obtiene la información del usuario
        try:
            user_info = GoogleOAuth.verify_token(credentials.id_token)
            if not user_info:
                messages.error(request, "No se pudo verificar la información del usuario")
                return redirect('login')
            
            print(f"✅ Usuario verificado: {user_info['email']}")
        except Exception as e:
            print(f"❌ Error verificando token: {e}")
            messages.error(request, "Error al verificar la identidad del usuario")
            return redirect('login')
        
        # Verifica si el usuario ya existe en tu base de datos
        email = user_info['email']
        try:
            usuario = Usuario.objects.get(email=email)
            print(f"✅ Usuario existente encontrado: {usuario.email}")
        except Usuario.DoesNotExist:
            # Crea un nuevo usuario
            print(f"🆕 Creando nuevo usuario para: {email}")
            # Genera una contraseña aleatoria segura
            import secrets
            random_password = secrets.token_urlsafe(16)
            
            usuario = Usuario.objects.create(
                email=email,
                nombre=user_info.get('name', email.split('@')[0]),
                contrasena=make_password(random_password)  # Contraseña segura aleatoria
            )
            print(f"✅ Nuevo usuario creado: {usuario.idUsuario}")
            
            # El signal @receiver(post_save, sender=Usuario) creará automáticamente el perfil
        
        # Inicia sesión estableciendo las variables de sesión
        request.session['usuario_id'] = usuario.idUsuario
        request.session['usuario_nombre'] = usuario.nombre
        request.session['usuario_email'] = usuario.email
        
        print(f"✅ Sesión iniciada para usuario ID: {usuario.idUsuario}")
        
        # Limpia el estado de la sesión de Google
        if 'google_auth_state' in request.session:
            del request.session['google_auth_state']
        
        # Verifica si necesita configuración inicial
        try:
            profile = Profile.objects.get(user=usuario)
            if not profile.config_completada:
                print("ℹ️ Usuario necesita configuración inicial")
                return redirect('configuracion_inicial')
        except Profile.DoesNotExist:
            print("ℹ️ Usuario no tiene perfil, redirigiendo a configuración")
            return redirect('configuracion_inicial')
        
        # Redirige al dashboard
        messages.success(request, f"¡Bienvenido/a {usuario.nombre}! Has iniciado sesión con Google.")
        return redirect('dashboard')
        
    except Exception as e:
        print(f"❌ ERROR en google_auth_callback: {e}")
        import traceback
        traceback.print_exc()
        messages.error(request, "Error inesperado durante la autenticación con Google")
        return redirect('login')
    
    
def eliminar_outfit(request, outfit_id):
    try:
        outfit = Outfit.objects.get(id=outfit_id, usuario=request.user)
        outfit.delete()
        return JsonResponse({'success': True, 'message': 'Outfit eliminado'})
    except Outfit.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Outfit no encontrado'}, status=404)
    
@csrf_exempt
@require_http_methods(["DELETE", "POST"])
@configuracion_requerida
def eliminar_outfit(request, outfit_id=None):
    """Eliminar un outfit y todas sus prendas asociadas"""
    try:
        if 'usuario_id' not in request.session:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado.'}, status=401)
        
        # Si es POST, obtener outfit_id del body
        if request.method == 'POST':
            data = json.loads(request.body)
            outfit_id = data.get('outfit_id')
        
        if not outfit_id:
            return JsonResponse({'success': False, 'error': 'No se proporcionó ID de outfit.'}, status=400)
        
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        
        print(f"🗑️ Intentando eliminar outfit ID: {outfit_id} para usuario: {usuario.email}")
        
        # Buscar el outfit (asegurarse de que pertenece al usuario)
        try:
            outfit = Outfit.objects.get(idOutfit=outfit_id, idUsuario=usuario)
        except Outfit.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Outfit no encontrado o no pertenece al usuario.'}, status=404)
        
        # Guardar información para el mensaje
        outfit_nombre = outfit.estilo
        outfit_fecha = outfit.fecha_creacion
        
        # Eliminar recomendaciones asociadas
        recomendaciones = Recomendacion.objects.filter(idOutfit=outfit)
        print(f"📊 Eliminando {recomendaciones.count()} recomendaciones...")
        recomendaciones.delete()
        
        # Eliminar prendas asociadas
        prendas = VerPrenda.objects.filter(outfit=outfit)
        print(f"👕 Eliminando {prendas.count()} prendas del outfit...")
        prendas.delete()
        
        # Eliminar el outfit
        outfit.delete()
        
        print(f"✅ Outfit eliminado exitosamente: {outfit_nombre}")
        
        return JsonResponse({
            'success': True,
            'message': f'Outfit "{outfit_nombre}" eliminado exitosamente.',
            'outfit_id': outfit_id,
            'outfit_nombre': outfit_nombre,
            'fecha': outfit_fecha.strftime('%Y-%m-%d %H:%M')
        })
        
    except Exception as e:
        print(f"❌ ERROR en eliminar_outfit: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'success': False, 
            'error': f'Error al eliminar el outfit: {str(e)}'
        }, status=500)


@csrf_exempt
@require_POST
@configuracion_requerida
def toggle_favorite_outfit(request):
    """Alternar estado de favorito de un outfit"""
    try:
        if 'usuario_id' not in request.session:
            return JsonResponse({'success': False, 'error': 'Usuario no autenticado.'}, status=401)
        
        data = json.loads(request.body)
        outfit_id = data.get('outfit_id')
        favorito = data.get('favorito', False)
        
        if not outfit_id:
            return JsonResponse({'success': False, 'error': 'No se proporcionó ID de outfit.'}, status=400)
        
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        
        # Buscar el outfit
        try:
            outfit = Outfit.objects.get(idOutfit=outfit_id, idUsuario=usuario)
        except Outfit.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Outfit no encontrado.'}, status=404)
        
        # Actualizar estado de favorito
        outfit.esFavorito = favorito
        outfit.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Outfit marcado como {"favorito" if favorito else "no favorito"}.',
            'outfit_id': outfit_id,
            'es_favorito': favorito
        })
        
    except Exception as e:
        print(f"❌ ERROR en toggle_favorite_outfit: {str(e)}")
        return JsonResponse({
            'success': False, 
            'error': f'Error al actualizar favorito: {str(e)}'
        }, status=500)
        

# En views.py
@configuracion_requerida
def obtener_contador_eventos(request):
    """API para obtener estadísticas de eventos del usuario"""
    if 'usuario_id' not in request.session:
        return JsonResponse({'error': 'No autenticado'}, status=401)
    
    try:
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        
        from datetime import date, timedelta
        
        # Conteos
        eventos_count = CalendarEventos.objects.filter(id_usuario=usuario).count()
        
        hoy = date.today()
        proxima_semana = hoy + timedelta(days=7)
        eventos_proximos = CalendarEventos.objects.filter(
            id_usuario=usuario,
            event_date__gte=hoy,
            event_date__lte=proxima_semana
        ).count()
        
        # Eventos de hoy
        eventos_hoy = CalendarEventos.objects.filter(
            id_usuario=usuario,
            event_date=hoy
        ).count()
        
        return JsonResponse({
            'success': True,
            'eventos_count': eventos_count,
            'eventos_proximos': eventos_proximos,
            'eventos_hoy': eventos_hoy,
            'message': f'Tienes {eventos_count} eventos en tu calendario'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })
    
    