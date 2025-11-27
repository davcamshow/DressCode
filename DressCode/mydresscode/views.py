
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

# Importa tus modelos y formularios
from .forms import EstiloForm, ColorForm, EstacionForm, TallaForm 
from .models import Profile, Usuario 

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
            profile = Profile.objects.get(user=user_instance)
        except (Usuario.DoesNotExist, Profile.DoesNotExist):
            # Si el usuario o perfil no existen, forzamos login
            return redirect('login') 

        # Si la configuración NO está completa, forzamos el asistente
        if not profile.config_completada:
            # Nota: usamos reverse() aquí porque configuracion_inicial es un nombre de URL
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

        # Validar que las contraseñas coincidan
        if contrasena != confirmar_contrasena:
            return render(request, 'Password.html', {'error': 'Las contraseñas no coinciden'})
        
        # Validar requisitos de contraseña
        if (len(contrasena) < 8 or 
            not any(c.isupper() for c in contrasena) or 
            not any(c.isdigit() for c in contrasena) or 
            not any(not c.isalnum() for c in contrasena)):
            return render(request, 'Password.html', {'error': 'La contraseña no cumple los requisitos'})

        if nombre and email and contrasena:
            usuario = Usuario(
                nombre=nombre,
                email=email,
                contrasena=make_password(contrasena)
            )
            usuario.save()

            # --- CREAR PERFIL INCOMPLETO INMEDIATAMENTE DESPUÉS DEL REGISTRO ---
            # Esto es necesario para que configuracion_requerida funcione sin error
            Profile.objects.create(user=usuario, config_completada=False)
            
            # Limpiar session
            if 'nombre' in request.session:
                del request.session['nombre']
            if 'email' in request.session:
                del request.session['email']
            
            # Agregar mensaje de éxito y redirigir al login
            messages.success(request, "¡Cuenta creada con éxito! ¡Bienvenido fashionista!")
            return redirect('login')
    
    return render(request, 'Password.html')


def login_view(request):
    """
    Maneja el inicio de sesión de usuarios de forma segura.
    """
    error = None 
    show_success_modal = False

    # Verificar si debemos mostrar el modal de éxito
    if request.COOKIES.get('show_success_modal') == 'true':
        show_success_modal = True
        response = render(request, 'login.html', {
            'error': error, 
            'show_success_modal': show_success_modal
        })
        response.set_cookie('show_success_modal', '', max_age=0)  
        return response

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


# Vistas protegidas
@configuracion_requerida
def dashboard_view(request):
    """Destino después del login exitoso/onboarding."""
    return render(request, 'inicio.html', {'message': '¡Bienvenido a tu Armario Digital!'})


@configuracion_requerida
def inicio(request):
    """Tu vista de inicio protegida."""
    return render(request, 'inicio.html')

def capturar_view(request):
    """Renderiza la página para capturar fotos con la cámara."""
    return render(request, 'camera.html')

def exit_view(request):
    return render(request, 'Cuenta creada.html')
def my_closet(request):
    if 'usuario_id' not in request.session:
        messages.error(request, "Debes iniciar sesión para ver tu armario.")
        return redirect('login') 

    try:
        usuario_id = request.session['usuario_id']
        usuario = Usuario.objects.get(idUsuario=usuario_id)
        prendas = Armario.objects.filter(idUsuario=usuario).order_by('-fecha')

        # DEBUG: Verificar imágenes segmentadas
        print(f"=== DEBUG MY_CLOSET ===")
        print(f"Usuario: {usuario}")
        print(f"Número de prendas: {prendas.count()}")
        
        for prenda in prendas:
            print(f"Prenda ID: {prenda.idPrenda}")
            print(f"  - Tipo: {prenda.tipo}")
            print(f"  - Imagen original: {prenda.imagen}")
            print(f"  - Imagen segmentada: {prenda.imagen_segmentada}")
            print(f"  - ¿Tiene segmentada?: {'SÍ' if prenda.imagen_segmentada else 'NO'}")
            print("---")

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
    
def categoria(request):
    return render(request, 'category.html')

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
def guardar_outfit(request):
    if request.method == 'POST':
        if request.headers.get("x-requested-with") != "XMLHttpRequest":
            return JsonResponse({'error': 'Solo AJAX permitido.'}, status=400)

        if 'usuario_id' not in request.session:
            return JsonResponse({'error': 'Usuario no autenticado.'}, status=401)

        try:
            usuario = Usuario.objects.get(idUsuario=request.session['usuario_id'])

            estilo = request.POST.get('estilo') or 'Sin estilo'
            clima = request.POST.get('clima_recomendado') or 'Desconocido'
            es_favorito = request.POST.get('esFavorito', 'false') == 'true'

            nuevo_outfit = Outfit.objects.create(
                idUsuario=usuario,
                estilo=estilo,
                clima_recomendado=clima,
                fecha_creacion=datetime.now(),
                esFavorito=es_favorito
            )

            imagenes = request.POST.getlist('imagenes')
            tipos = request.POST.getlist('tipos')

            for url, tipo in zip(imagenes, tipos):
                VerPrenda.objects.create(
                    outfit=nuevo_outfit,
                    imagen_url=url,
                    tipo_prenda=tipo
                )

            return JsonResponse({
                'success': True,
                'message': 'Outfit guardado exitosamente.',
                'outfit_id': nuevo_outfit.idOutfit
            }, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Petición inválida.'}, status=400)

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

@login_required
def configuration_system(request):
    """Vista principal del sistema de configuración"""
    context = {
        'user': request.user,
        'active_tab': 'general'
    }
    return render(request, 'configurationsystem.html', context)