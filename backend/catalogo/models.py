from django.db import models
from usuarios.models import Usuario

# Create your models here.
class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    ESTADOS_MODERACION = (
        ('Pendiente', 'Pendiente de Revisión'),
        ('Aprobado', 'Aprobado'),
        ('Rechazado', 'Rechazado'),
    )

    productor = models.ForeignKey(Usuario, on_delete=models.CASCADE, limit_choices_to={'rol': 'Productor'}, related_name='productos')
    
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True, related_name='productos')
    
    nombre = models.CharField(max_length=150)
    historia = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    region_origen = models.CharField(max_length=100, blank=True, null=True)
    
    es_km0 = models.BooleanField(default=False)
    es_organico = models.BooleanField(default=False)
    
    estado_moderacion = models.CharField(max_length=20, choices=ESTADOS_MODERACION, default='Pendiente')

    def __str__(self):
        return f"{self.nombre} - {self.productor.nombre_completo}"

class ProductoImagen(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='imagenes')
    imagen = models.ImageField(upload_to='productos_imagenes/')
    es_principal = models.BooleanField(default=False)

    def __str__(self):
        return f"Imagen de {self.producto.nombre}"