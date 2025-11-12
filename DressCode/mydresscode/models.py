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
    idUsuario = models.ForeignKey('Usuario', on_delete=models.CASCADE, related_name='prendas', db_column='idUsuario')
    color = models.CharField(max_length=40)
    tipo = models.CharField(max_length=50)
    imagen = models.CharField(max_length=255)
    imagen_segmentada = models.CharField(max_length=255, blank=True, null=True)  # ✅ aquí sí
    temporada = models.CharField(max_length=40, blank=True)
    estilo = models.CharField(max_length=60, blank=True)
    clasificacion = models.CharField(max_length=60, blank=True)
    esFavorito = models.BooleanField(default=False)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'armario'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.tipo} ({self.color})"
    
class Outfit(models.Model):
    idOutfit = models.AutoField(primary_key=True)
    idUsuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='idUsuario')  # FK a Usuario
    estilo = models.CharField(max_length=45)
    clima_recomendado = models.CharField(max_length=45)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    esFavorito = models.BooleanField(default=False)  # TINYINT → Boolean

    class Meta:
        db_table = 'outfit'
    
    def __str__(self):
        return self.estilo
    
class Recomendacion(models.Model):
    idRecomendacion = models.AutoField(primary_key=True)
    idUsuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='idUsuario')  # FK a Usuario
    idOutfit = models.ForeignKey(Outfit, on_delete=models.CASCADE, db_column='idOutfit')    # FK a Outfit
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    clima_del_dia = models.CharField(max_length=45)
    valoracion = models.CharField(max_length=45) # Puedes ajustar si es categoría o FK

    class Meta:
        db_table = 'recomendacion'

    def __str__(self):
        return self.fecha_generacion




class Outfit(models.Model):
    idOutfit = models.AutoField(primary_key=True)
    idUsuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='idUsuario')
    estilo = models.CharField(max_length=45)
    clima_recomendado = models.CharField(max_length=45)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    esFavorito = models.BooleanField(default=False)

    class Meta:
        db_table = 'outfit'

    def __str__(self):
        return self.estilo

class VerPrenda(models.Model):
    id = models.AutoField(primary_key=True)
    outfit = models.ForeignKey('Outfit', on_delete=models.CASCADE, db_column='outfit_id', related_name='ver_prendas')
    imagen_url = models.TextField()
    tipo_prenda = models.TextField()

    class Meta:
        db_table = 'ver_prenda'

    def __str__(self):
        return f"{self.tipo_prenda} ({self.outfit_id})"
    
class Recomendacion(models.Model):
    idRecomendacion = models.AutoField(primary_key=True)
    idUsuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='idUsuario')  # FK a Usuario
    idOutfit = models.ForeignKey(Outfit, on_delete=models.CASCADE, db_column='idOutfit')    # FK a Outfit
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    clima_del_dia = models.CharField(max_length=45)
    valoracion = models.CharField(max_length=45) # Puedes ajustar si es categoría o FK

    class Meta:
        db_table = 'recomendacion'

    def __str__(self):
        return self.fecha_generacion