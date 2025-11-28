from django.urls import path
from . import views
#config
from .views import ConfiguracionWizard, FORMS, dashboard_view
from django.shortcuts import render


urlpatterns = [
    path('', views.home, name="home"),
    path('login/', views.login_view, name='login'),
    path('recovery/', views.recovery_view, name='recovery'),
    path('newPassword/', views.newPassword_view, name='newPassword'),
    path('register/', views.register_view, name='register'), 
    path('register/password/', views.register_password_view, name='register_password'),
    path('inicio/', views.inicio, name='inicio'),
    path('camera/', views.capturar_view, name='camera'), 
    path('logout/', views.logout_view, name='logout'),
    path('closet/', views.my_closet, name='my_closet'),
    path('categoria/', views.categoria, name='categoria'),
    path('subir-prenda/', views.subir_prenda, name='subir_prenda'),
    path('resultados/<int:prenda_id>/', views.resultados_analisis, name='resultados_analisis'),
    path('eliminar-prendas/', views.eliminar_prendas, name='eliminar_prendas'),
    path('seleccionar-categoria/', views.seleccionar_categoria, name='seleccionar_categoria'),
    path('segmentar-prendas/', views.segmentar_todas_las_prendas, name='segmentar_prendas'),
    path('seleccionar-categoria/', views.seleccionar_categoria, name='seleccionar_categoria'),
    path('outfit/', views.outfit, name='outfit'),
    path('vision/', views.vision_computer, name='visioncomputer'),
    path('recomendar-outfit/', views.recomendar_outfit, name='recomendar_outfit'),
    path('guardar-outfit/', views.guardar_outfit, name='guardar_outfit'),
    path('api/opciones-filtro/', views.opciones_filtro_api, name='opciones_filtro_api'),
    path('configuracion-inicial/', ConfiguracionWizard.as_view(FORMS), name='configuracion_inicial'),
    path('dashboard/', views.dashboard_view, name='dashboard'),  
    path('sideface/', views.sideface_view, name='sideface'), 
    path("guardar-rating/", views.guardar_rating, name="guardar_rating"),
    path('sobre-nosotros/', views.sobre_nosotros, name='sobre_nosotros'),
    path('contacto/', views.contacto, name='contacto'),

    path('subir-prenda/', views.subir_prenda, name='subir_prenda'),
    path('segmentar-prenda/', views.segmentar_prenda, name='segmentar-prenda'),

    path('ayuda-contacto/', views.ayuda_contacto, name='ayuda_contacto'),
    path('configurationsystem/', views.configuration_system, name='configurationsystem'),
    path("calendario/", views.calendar_view, name="calendar"),
    path("calendario/<int:year>/<int:month>/", views.calendar_view, name="calendar_month"),
    path('calendar/events/', views.calendar_events_api, name='calendar_events_api'),
]


