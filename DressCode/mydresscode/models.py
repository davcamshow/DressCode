from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


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
    imagen_segmentada = models.CharField(max_length=255, blank=True, null=True)
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
        return f"{self.tipo_prenda} ({self.outfit.idOutfit})"


class Recomendacion(models.Model):
    idRecomendacion = models.AutoField(primary_key=True)
    idUsuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='idUsuario')
    idOutfit = models.ForeignKey(Outfit, on_delete=models.CASCADE, db_column='idOutfit')
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    clima_del_dia = models.CharField(max_length=45)
    valoracion = models.IntegerField()

    class Meta:
        db_table = 'recomendacion'

    def __str__(self):
        return f"Recomendación {self.idRecomendacion} - {self.fecha_generacion.strftime('%Y-%m-%d')}"


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
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                name='unique_user_profile'
            )
        ]
    
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


class CalendarEventos(models.Model):
    id = models.BigAutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    event_date = models.DateField(null=True, blank=True)
    event_title = models.CharField(max_length=255, null=True, blank=True)
    event_outfit = models.CharField(max_length=255, null=True, blank=True)
    event_location = models.TextField(null=True, blank=True)
    event_description = models.TextField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    id_usuario = models.ForeignKey(
        'Usuario', 
        on_delete=models.CASCADE, 
        db_column='idUsuario',
        null=True, 
        blank=True
    )

    class Meta:
        db_table = 'calendar_eventos'

    def __str__(self):
        return f"{self.event_title} - {self.event_date}"

    def save(self, *args, **kwargs):
        if self.pk:
            self.updated_at = timezone.now()
        super().save(*args, **kwargs)


# En tu models.py, asegúrate de que el signal use get_or_create
@receiver(post_save, sender=Usuario)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        # ✅ USAR get_or_create PARA EVITAR DUPLICADOS
        Profile.objects.get_or_create(
            user=instance,
            defaults={
                'config_completada': False,
                'nombre_completo': instance.nombre
            }
        )
        print(f"✅ Perfil creado/verificado para usuario: {instance.email}")

@receiver(post_save, sender=Usuario)
def guardar_perfil_usuario(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()