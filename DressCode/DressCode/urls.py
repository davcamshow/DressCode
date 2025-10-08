from django.contrib import admin
from django.urls import path,include
from mydresscode import views  

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include ('mydresscode.urls')),    
]