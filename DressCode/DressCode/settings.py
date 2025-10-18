"""
Django settings for DressCode project.
"""

from pathlib import Path
import os
import json
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-782wde$qls(t$5_0&epbv@53qhvqjffnoy(z+y#e_ap*j9#xab'

DEBUG = True

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'mydresscode',
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
        'USER': 'postgres',
        'PASSWORD': os.getenv('SUPABASE_DB_PASSWORD'),
        'HOST': os.getenv('SUPABASE_DB_HOST'),
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require',
        },
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
STATICFILES_DIRS = [BASE_DIR / "mydresscode" / "static"]
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuración Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
SUPABASE_STORAGE_BUCKET = 'armario-digital'

# Configuración Google Cloud Vision
GOOGLE_CLOUD_CREDENTIALS = {
    "type": "service_account",
    "project_id": "micro-agency-475308-b4",
    "private_key_id": "bb4dfa9f5d115ee39fe9a971742566d081a20580",
    "private_key": os.getenv('GOOGLE_CLOUD_PRIVATE_KEY', '').replace('\\n', '\n'),
    "client_email": "dresscode-vision-packaging-ana@micro-agency-475308-b4.iam.gserviceaccount.com",
    "client_id": "100507476148578825873",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/dresscode-vision-packaging-ana%40micro-agency-475308-b4.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
}

# Guardar credenciales de Google Cloud
GOOGLE_APPLICATION_CREDENTIALS = BASE_DIR / 'google_credentials.json'
with open(GOOGLE_APPLICATION_CREDENTIALS, 'w') as f:
    json.dump(GOOGLE_CLOUD_CREDENTIALS, f)

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(GOOGLE_APPLICATION_CREDENTIALS)

print("=== CONFIGURACIÓN COMPLETADA ===")
print("Supabase Host:", os.getenv('SUPABASE_DB_HOST'))
print("Google Cloud configurado:", GOOGLE_APPLICATION_CREDENTIALS.exists())