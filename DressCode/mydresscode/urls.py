from django.urls import path
from . import views


urlpatterns = [
    path('', views.home, name = "home"),
    path('login/', views.login_view, name='login'),
    path('recovery/', views.recovery_view, name='recovery'),
    path('newPassword/', views.newPassword_view, name='newPassword'),
    path('register/', views.register_view, name='register'), 
    path('register/password/', views.register_password_view, name='register_password'),
    path('inicio/', views.inicio, name='inicio'),
    path('logout/', views.logout_view, name='logout'),
]