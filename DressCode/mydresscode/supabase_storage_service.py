
# mydresscode/services/supabase_storage_service.py
import os
import uuid
from django.conf import settings
from supabase import create_client, Client

class SupabaseStorageService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_KEY
        )
        self.bucket_name = getattr(settings, 'SUPABASE_STORAGE_BUCKET', 'profile-pictures')
    
    def upload_profile_picture(self, user_id, image_file):
        """Sube una imagen de perfil a Supabase Storage"""
        try:
            # Validar que el archivo sea una imagen
            if not image_file.content_type.startswith('image/'):
                return {
                    'success': False, 
                    'error': 'El archivo debe ser una imagen'
                }
            
            # Generar nombre único para el archivo
            file_extension = os.path.splitext(image_file.name)[1].lower()
            unique_filename = f"user_{user_id}/profile_{uuid.uuid4()}{file_extension}"
            
            # Leer el contenido del archivo
            file_content = image_file.read()
            
            # Subir el archivo a Supabase Storage
            response = self.supabase.storage().from_(self.bucket_name).upload(
                unique_filename,
                file_content,
                file_options={"content-type": image_file.content_type}
            )
            
            if not response:
                return {'success': False, 'error': 'Error al subir la imagen'}
            
            # Obtener URL pública
            public_url = self.supabase.storage().from_(self.bucket_name).get_public_url(unique_filename)
            
            return {
                'success': True,
                'public_url': public_url,
                'file_path': unique_filename
            }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def delete_profile_picture(self, file_path):
        """Elimina una imagen de perfil de Supabase Storage"""
        try:
            if not file_path:
                return {'success': False, 'error': 'No hay ruta de archivo proporcionada'}
            
            response = self.supabase.storage().from_(self.bucket_name).remove([file_path])
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def check_bucket_exists(self):
        """Verifica si el bucket existe"""
        try:
            buckets = self.supabase.storage.list_buckets()
            bucket_names = [bucket.name for bucket in buckets]
            return self.bucket_name in bucket_names
        except Exception as e:
            print(f"Error verificando bucket: {e}")
            return False

# Instancia global del servicio
supabase_storage_service = SupabaseStorageService()