# check_google.py
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DressCode.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    django.setup()
    print("✅ Django configurado correctamente")
    
    # Verificar settings
    from django.conf import settings
    print(f"\n🔧 CONFIGURACIÓN GOOGLE:")
    print(f"CLIENT_ID: {settings.GOOGLE_OAUTH2_CLIENT_ID[:20]}...")
    print(f"REDIRECT_URI: {settings.GOOGLE_OAUTH2_REDIRECT_URI}")
    
    # Probar la generación de URL
    from mydresscode.google_auth import GoogleOAuth
    try:
        auth_url, state = GoogleOAuth.get_auth_url()
        print(f"\n✅ URL generada: {auth_url}")
        print(f"✅ Estado generado: {state}")
    except Exception as e:
        print(f"\n❌ Error generando URL: {e}")
        import traceback
        traceback.print_exc()
        
except Exception as e:
    print(f"❌ Error general: {e}")
    import traceback
    traceback.print_exc()