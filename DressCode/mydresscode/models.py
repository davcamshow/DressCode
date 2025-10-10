from django.db import models

class Usuario(models.Model):
    idUsuario = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=45)
    nombre = models.CharField(max_length=100)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

    class Meta:
        db_table = 'usuario'  
