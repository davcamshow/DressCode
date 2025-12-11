# settings.py - CORREGIR
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-782wde$qls(t$5_0&epbv@53qhvqjffnoy(z+y#e_ap*j9#xab'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'mydresscode',
    'formtools',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'DressCode.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'mydresscode/templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'DressCode.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres', 
        'USER': 'postgres.uovktvztwuzstzbzjafr', 
        'PASSWORD': 'Ghbase2121',
        'HOST': 'aws-1-us-east-2.pooler.supabase.com', 
        'PORT': '5432',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'mydresscode/static'),
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGIN_REDIRECT_URL = '/configuracion-inicial/'

# CORRECCIÓN: Configuración Supabase - usar las variables correctas
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://uovktvztwuzstzbzjafr.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdmt0dnp0d3V6c3R6YnpqYWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzY2OTIsImV4cCI6MjA3NTk1MjY5Mn0.ZeelvIIIXAxawn_I-pCF2MX4kct1ldNNKUMZ-t8PtQc')
SUPABASE_STORAGE_BUCKET = 'armario-digital'

print("=== CONFIGURACIÓN COMPLETADA ===")
print("Supabase URL:", SUPABASE_URL)
print("Supabase Key:", SUPABASE_KEY[:20] + "...")  # Mostrar solo parte por seguridad

LOGIN_URL = '/login/'

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Configuración de Google OAuth
GOOGLE_OAUTH2_CLIENT_ID = '896110014714-rg80884l1v7ve8lqia25scrddon2lgv9.apps.googleusercontent.com'
GOOGLE_OAUTH2_CLIENT_SECRET = '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'
GOOGLE_OAUTH2_REDIRECT_URI = 'http://127.0.0.1:8000/google_login/google/authorized/'
GOOGLE_OAUTH2_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
]

# Configuración de sesión para OAuth
SESSION_COOKIE_SECURE = False  # Cambiar a True en producción con HTTPS
SESSION_COOKIE_SAMESITE = 'Lax'

# Dominios permitidos
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '*']