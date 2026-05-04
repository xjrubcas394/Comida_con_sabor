from django.contrib import admin
from .models import Categoria, Producto, ProductoImagen, Pedido, DetallePedido

# Register your models here.
class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 1

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    # Columnas
    list_display = ('nombre', 'productor', 'categoria', 'precio', 'stock', 'estado_moderacion')
    # Filtros
    list_filter = ('estado_moderacion', 'categoria', 'es_km0', 'es_organico')
    search_fields = ('nombre', 'productor__nombre_completo')
    
    # Añadimos bloque de imagenes
    inlines = [ProductoImagenInline]

class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 0 # Para que no muestre filas vacías extra por defecto
    # Hacemos que estos campos sean de solo lectura para no alterar facturas pasadas
    readonly_fields = ['producto', 'cantidad', 'precio_unitario'] 

# 2. Registramos el Pedido principal
@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    # Columnas que se verán en la tabla principal
    list_display = ('id', 'nombre_cliente', 'ciudad', 'total', 'estado', 'fecha_creacion')
    # Filtros laterales muy útiles
    list_filter = ('estado', 'fecha_creacion')
    # Barra de búsqueda
    search_fields = ('nombre_cliente', 'email', 'id')
    # Le incrustamos los detalles (las líneas del ticket)
    inlines = [DetallePedidoInline]