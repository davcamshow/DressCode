from django.shortcuts import render, redirect
from django.db import connection, OperationalError
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from .models import Usuario


def home(request):
    return render(request, 'welcome.html')  


def recovery_view(request):
    return render(request, 'recovery.html')


def newPassword_view(request):
    return render(request, 'newPassword.html')    


def register_view(request):
    return render(request, 'register.html')


def login_view(request):
    error = None

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Verificar si existe un usuario con ese correo y contraseña
        usuario = Usuario.objects.filter(email=email, contrasena=password).first()

        if usuario:
            error = "✅ Usuario encontrado. Bienvenido/a."
        else:
            error = "❌ El correo o la contraseña no coinciden."

    return render(request, 'login.html', {'error': error})
