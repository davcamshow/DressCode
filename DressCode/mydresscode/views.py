from django.shortcuts import render

def home(request):
    return render(request, 'welcome.html')  

def login_view(request):
    return render(request, 'login.html')  

def recovery_view(request):
    return render(request, 'recovery.html')

def newPassword_view(request):
    return render(request, 'newPassword.html')    

def register_view(request):
    return render(request, 'register.html')
 
