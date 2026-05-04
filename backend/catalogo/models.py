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

class Pedido(models.Model):
    nombre_cliente = models.CharField(max_length=200)
    email = models.EmailField()
    direccion = models.CharField(max_length=255)
    ciudad = models.CharField(max_length=100)
    
    total = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    ESTADOS = [
        ('Pendiente', 'Pendiente'),
        ('Enviado', 'Enviado'),
        ('Entregado', 'Entregado'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADOS, default='Pendiente')

    def __str__(self):
        return f"Pedido #{self.id} - {self.nombre_cliente} ({self.fecha_creacion.strftime('%d/%m/%Y')})"

class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='detalles', on_delete=models.CASCADE)

    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        nombre_prod = self.producto.nombre if self.producto else "Producto Eliminado"
        return f"{self.cantidad}x {nombre_prod} (Pedido #{self.pedido.id})"