# mydresscode/check_supabase.py
from django.conf import settings
from supabase import create_client

def check_supabase():
    print("=== VERIFICANDO CONFIGURACIÓN SUPABASE ===")
    print(f"URL: {settings.SUPABASE_URL}")
    print(f"Key: {settings.SUPABASE_KEY[:20]}...")
    print(f"Bucket: {settings.SUPABASE_STORAGE_BUCKET}")
    
    try:
        # Probar cliente
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        print("✅ Cliente Supabase creado correctamente")
        
        # Probar conexión a base de datos
        response = supabase.table('armario').select('*').limit(1).execute()
        print(f"✅ Conexión a DB: {len(response.data)} registros encontrados")
        
        # Probar storage
        try:
            buckets = supabase.storage.list_buckets()
            bucket_names = [bucket.name for bucket in buckets]
            print(f"✅ Buckets de storage: {bucket_names}")
            
            if settings.SUPABASE_STORAGE_BUCKET in bucket_names:
                print("✅ Bucket 'armario-digital' encontrado")
            else:
                print("❌ Bucket 'armario-digital' NO encontrado")
                
        except Exception as e:
            print(f"❌ Error en storage: {e}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

if __name__ == "__main__":
    check_supabase()