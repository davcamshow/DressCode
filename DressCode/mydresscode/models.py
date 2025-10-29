from django.db import models

class Usuario(models.Model):
    idUsuario = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=129)
    nombre = models.CharField(max_length=100)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

    class Meta:
        db_table = 'usuario'

class Armario(models.Model):
    idPrenda = models.AutoField(primary_key=True)

    idUsuario = models.ForeignKey(
        'Usuario',              # también puedes usar Usuario directamente si está arriba
        on_delete=models.CASCADE,
        related_name='prendas',  # acceso: usuario.prendas.all()
        db_column='idUsuario',   # nombre real de la columna en la BD
    )

    color = models.CharField(max_length=40)
    tipo = models.CharField(max_length=50)        # camisa, falda, pantalón, etc.
    imagen = models.CharField(max_length=255)     # ruta o URL en Supabase Storage
    temporada = models.CharField(max_length=40, blank=True)
    estilo = models.CharField(max_length=60, blank=True)
    clasificacion = models.CharField(max_length=60, blank=True)
    esFavorito = models.BooleanField(default=False)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'armario'
        ordering = ['-fecha']  # más recientes primero

    def __str__(self):
        return f"{self.tipo} ({self.color})"
    
imagen_segmentada = models.CharField(max_length=255, blank=True, null=True)
class Armario(models.Model):
    idPrenda = models.AutoField(primary_key=True)
    idUsuario = models.ForeignKey('Usuario', on_delete=models.CASCADE, related_name='prendas', db_column='idUsuario')
    color = models.CharField(max_length=40)
    tipo = models.CharField(max_length=50)
    imagen = models.CharField(max_length=255)
    imagen_segmentada = models.CharField(max_length=255, blank=True, null=True)  
    temporada = models.CharField(max_length=40, blank=True)
    estilo = models.CharField(max_length=60, blank=True)
    clasificacion = models.CharField(max_length=60, blank=True)
    esFavorito = models.BooleanField(default=False)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'armario'
        ordering=['-fecha']
