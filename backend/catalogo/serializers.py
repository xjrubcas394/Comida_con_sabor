from rest_framework import serializers
from .models import Categoria, Producto, ProductoImagen

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen', 'es_principal']

class ProductoSerializer(serializers.ModelSerializer):
    # Magia de DRF: Anidamos las imágenes dentro del producto usando el 'related_name' que definimos
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    
    # Extraemos nombres legibles para que React no reciba solo números de ID
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    productor_nombre = serializers.ReadOnlyField(source='productor.nombre_completo')

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'historia', 'precio', 'stock', 'region_origen',
            'es_km0', 'es_organico', 'estado_moderacion',
            'categoria', 'categoria_nombre', 'productor', 'productor_nombre',
            'imagenes'
        ]
        
        read_only_fields = ['productor', 'estado_moderacion']