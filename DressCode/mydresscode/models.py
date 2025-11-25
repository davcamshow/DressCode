from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


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
    idUsuario = models.ForeignKey('Usuario', on_delete=models.CASCADE, related_name='prendas_segmentadas', db_column='idUsuario')
    color = models.CharField(max_length=40)
    tipo = models.CharField(max_length=50)
    imagen = models.CharField(max_length=255)
    imagen_segmentada = models.CharField(max_length=255, blank=True, null=True)  # ✅ Campo para imágenes segmentadas
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
    valoracion = models.IntegerField()   # de 1 a 5


    class Meta:
        db_table = 'recomendacion'

    def __str__(self):
        return self.fecha_generacion
    

    
    #agrego para el perfil del usuario

class Profile(models.Model):
    user = models.OneToOneField(
        'Usuario', 
        on_delete=models.CASCADE,
        primary_key=True,  
        db_column='id_Usuario'  
    )

    nombre_completo = models.CharField(max_length=100, blank=True, null=True, db_column='nombre_completo') 
    talla_superior = models.CharField(max_length=20, blank=True, null=True)  
    talla_inferior = models.CharField(max_length=20, blank=True, null=True)  
    talla_calzado = models.CharField(max_length=20, blank=True, null=True)  
    estilos = models.JSONField(default=list, blank=True, db_column='estilos_fav')           
    colores_fav = models.JSONField(default=list, blank=True)                               
    temporadas_fav = models.JSONField(default=list, blank=True, db_column='temporadas_fav') 
    config_completada = models.BooleanField(default=False, db_column='config_completada')      
    creado_en = models.DateTimeField(auto_now_add=True)                                    
    actualizado_en = models.DateTimeField(auto_now=True, db_column='actualizado_en')       
    
    class Meta:
        db_table = 'perfil_usuario'
        verbose_name = 'Perfil de usuario'
        verbose_name_plural = 'Perfiles de usuarios'
    
    def __str__(self):
        return f"Perfil de {self.user.nombre}"
    
    def agregar_estilo(self, estilo):
        if estilo not in self.estilos:
            self.estilos.append(estilo)
            self.save()
    
    def agregar_color(self, color):
        if color not in self.colores_fav:
            self.colores_fav.append(color)
            self.save()
    
    def completar_onboarding(self):
        self.config_completada = True 
        self.save()