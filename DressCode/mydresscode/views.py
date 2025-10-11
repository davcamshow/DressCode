from django.shortcuts import render, redirect
from django.db import connection, OperationalError
from django.contrib.auth import authenticate, login
from .models import Usuario 
from django.contrib.auth import logout #para hacer que el usuario se redirija al login despues de cerrar sesion
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password


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
            return redirect('login')  # o 'inicio' si prefieres
    return render(request, 'Password.html')


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
    logout(request)
    return redirect('login') # Redirige a la URL con el nombre 'login'