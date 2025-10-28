from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('login/', views.login_view, name='login'),
    path('recovery/', views.recovery_view, name='recovery'),
    path('newPassword/', views.newPassword_view, name='newPassword'),
    path('register/', views.register_view, name='register'), 
    path('register/password/', views.register_password_view, name='register_password'),
    path('password/Cuenta creada', views.exit_view, name='Cuenta creada'),
    path('inicio/', views.inicio, name='inicio'),
    path('camera/', views.capturar_view, name='camera'), 
    path('logout/', views.logout_view, name='logout'),
    path('closet/', views.my_closet, name='my_closet'),
    path('subir-prenda/', views.subir_prenda, name='subir_prenda'),
    path('resultados/<int:prenda_id>/', views.resultados_analisis, name='resultados_analisis'),
    path('eliminar-prendas/', views.eliminar_prendas, name='eliminar_prendas'),
    path('añadir/', views.añadir_prenda, name='añadir_prenda'),
    path('seleccionar-categoria/', views.seleccionar_categoria, name='seleccionar_categoria'),
]