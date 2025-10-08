from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name = "home"),
    path('login/', views.login_view, name='login'),
    path('recovery/', views.recovery_view, name='recovery'),
    path('newPassword/', views.newPassword_view, name='newPassword'),
]