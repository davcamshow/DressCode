from django.shortcuts import render, redirect, get_object_or_404
from django.db import connection, OperationalError
from django.contrib.auth import authenticate, login, logout
from .models import Usuario, Armario, Outfit, VerPrenda
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
from django.contrib.auth.decorators import login_required

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
            
            # Limpiar session
            if 'nombre' in request.session:
                del request.session['nombre']
            if 'email' in request.session:
                del request.session['email']
            
            # Agregar mensaje de éxito y redirigir al login
            messages.success(request, "¡Cuenta creada con éxito! ¡Bienvenido fashionista!")
            return redirect('login')
    
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
    show_success_modal = False

    # Verificar si debemos mostrar el modal de éxito
    if request.COOKIES.get('show_success_modal') == 'true':
        show_success_modal = True
        # Crear una respuesta para limpiar la cookie
        response = render(request, 'login.html', {
            'error': error, 
            'show_success_modal': show_success_modal
        })
        response.set_cookie('show_success_modal', '', max_age=0)  # Eliminar cookie
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
            request.session['usuario_id'] = usuario.idUsuario
            request.session['usuario_nombre'] = usuario.nombre
            return redirect('inicio')
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

def categoria(request):
    return render(request, 'category.html')

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

def recomendar_outfit(request):
    estilo = request.GET.get('estilo')
    temporada = request.GET.get('temporada')
    ciudad = request.GET.get('ciudad', 'Morelia')
    color = request.GET.get('color')   # <-- nuevo
    modo = request.GET.get('modo', None)
    usuario_id = request.session.get('usuario_id')

    # --- Lógica por COLOR ---
    if modo == 'color' and color:
        query = supabase.table("armario").select("*")
        if usuario_id:
            query = query.eq("idUsuario", usuario_id)
        prendas = query.execute().data

        # Filtrar prendas por color exacto
        prendas_color = [p for p in prendas if p.get('color') and p['color'].lower() == color.lower()]

        vestidos = [p for p in prendas_color if 'vestido' in p['tipo'].lower()]
        partes_superiores = [p for p in prendas_color if any(t in p['tipo'].lower() for t in ['camisa','blusa'])]
        partes_inferiores = [p for p in prendas_color if any(t in p['tipo'].lower() for t in ['pantalón','falda','short'])]
        calzados = [p for p in prendas_color if any(t in p['tipo'].lower() for t in ['zapato','sandalia','tenis','bota'])]
        accesorios = [p for p in prendas_color if any(t in p['tipo'].lower() for t in ['bolso','collar','pulsera','reloj','sombrero','cinturón','cartera','aretes'])]

        usar_vestido = vestidos and random.choice([True, False])
        if usar_vestido:
            outfit = {
                'vestido': random.choice(vestidos),
                'calzado': random.choice(calzados) if calzados else None,
                'accesorios': {'Extra': random.choice(accesorios)} if accesorios else {}
            }
        else:
            outfit = {
                'parte_superior_base': random.choice(partes_superiores) if partes_superiores else None,
                'parte_inferior': random.choice(partes_inferiores) if partes_inferiores else None,
                'calzado': random.choice(calzados) if calzados else None,
                'accesorios': {'Extra': random.choice(accesorios)} if accesorios else {}
            }

        return render(request, 'outfit.html', {
            'outfit': outfit,
            'color': color
        })

    # --- Lógica por CLIMA (lo que ya tenías) ---
    def obtener_clima(ciudad):
        API_KEY = '8a33fa8635d6adf10672a0fa18b68316'
        url = f'https://api.openweathermap.org/data/2.5/weather?q={ciudad}&appid={API_KEY}&units=metric&lang=es'
        try:
            resp = requests.get(url, timeout=5)  # timeout evita bloqueos
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
            return ['Shorts', 'Falda', 'Vestido', 'Sandalias', 'Gafas de sol', 'Camisa', 'Blusa']

    tipos_clima = tipos_por_temperatura(temp)

    def obtener_prenda_por_tipo(tipos):
        try:
            query = supabase.table("armario").select("*")
            if usuario_id:
                query = query.eq("idUsuario", usuario_id)
            if estilo:
                query = query.ilike("estilo", f"%{estilo}%")
            if temporada:
                query = query.ilike("temporada", f"%{temporada}%")
            prendas = query.execute().data
        except Exception as e:
            print("Error al consultar Supabase:", e)
            prendas = []
        return [p for p in prendas if 'tipo' in p and any(t.lower() in p['tipo'].lower() for t in tipos)]

    def filtrar_por_clima(lista):
        return [p for p in lista if any(t in p['tipo'] for t in tipos_clima)]

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
        'temporada': temporada
    })




from django.http import JsonResponse

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

def configuracion_inicial_view(request):
    # Lógica para verificar el estado de Supabase...
    # Si la configuración está COMPLETA, redirigir: return redirect('home_url') 

    # Si la configuración está INCOMPLETA, renderizar el template:
    return render(request, 'configuracionInicial.html')

