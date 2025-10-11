from django.shortcuts import render, redirect
from django.db import connection, OperationalError
from django.contrib.auth import authenticate, login
from .models import Usuario 
from django.contrib.auth import logout #para hacer que el usuario se redirija al login despues de cerrar sesion

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
    """Renderiza la página de registro."""
    return render(request, 'register.html')

def register_password_view(request):
    """Renderiza la página para ingresar la contraseña de registro."""
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

        # 1. Autentica al usuario de forma segura con el sistema de Django.
        #    Django se encarga de verificar el email (username) y la contraseña cifrada.
        usuario = Usuario.objects.filter(email=email, contrasena=password).first()

        if usuario is not None:
            # 2. Inicia la sesión para el usuario autenticado.
            login(request, usuario)
            # 3. Redirige al usuario a la página de inicio (o a donde desees).
            return redirect('inicio')
        else:
            # Si la autenticación falla, establece un mensaje de error.
            error = "El correo o la contraseña no coinciden."

    # Renderiza el formulario de login con cualquier mensaje de error.
    return render(request, 'login.html', {'error': error})

def logout_view(request):
    """
    Cierra la sesión del usuario y lo redirige a la página de login.
    """
    logout(request)
    return redirect('login') # Redirige a la URL con el nombre 'login'