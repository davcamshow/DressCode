from django.shortcuts import render

from django.shortcuts import render

def home(request):
    return render(request, 'welcome.html')  

def login_view(request):
    return render(request, 'login.html')  
