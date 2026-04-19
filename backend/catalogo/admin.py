from django.contrib import admin
from .models import Categoria, Producto, ProductoImagen

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