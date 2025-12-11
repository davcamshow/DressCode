# mydresscode/google_auth.py
import os
import json
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests
from google_auth_oauthlib.flow import Flow

class GoogleOAuth:
    @staticmethod
    def get_flow(redirect_uri=None):
        """Crea y configura el flujo de OAuth de Google"""
        # Usar el client secret que ya tienes en JSON
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_OAUTH2_CLIENT_ID,
                "client_secret": settings.GOOGLE_OAUTH2_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri or settings.GOOGLE_OAUTH2_REDIRECT_URI]
            }
        }
        
        flow = Flow.from_client_config(
            client_config,
            scopes=settings.GOOGLE_OAUTH2_SCOPES,
            redirect_uri=redirect_uri or settings.GOOGLE_OAUTH2_REDIRECT_URI
        )
        return flow

    @staticmethod
    def get_auth_url():
        """Genera la URL de autorización de Google"""
        flow = GoogleOAuth.get_flow()
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        return authorization_url, state

    @staticmethod
    def verify_token(token):
        """Verifica el token de Google y obtiene la información del usuario"""
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
            )
            
            # Verificar que el token sea válido
            if idinfo['aud'] != settings.GOOGLE_OAUTH2_CLIENT_ID:
                raise ValueError("Token no válido para esta aplicación")
            
            return {
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
                'picture': idinfo.get('picture', ''),
                'google_id': idinfo['sub'],
                'verified_email': idinfo.get('email_verified', False)
            }
        except ValueError as e:
            print(f"Error de validación de token: {e}")
            return None
        except Exception as e:
            print(f"Error verificando token: {e}")
            return None