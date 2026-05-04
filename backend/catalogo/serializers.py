from rest_framework import serializers
from .models import Categoria, Producto, ProductoImagen, DetallePedido, Pedido

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

class DetallePedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePedido
        fields = ['producto', 'cantidad', 'precio_unitario']

class PedidoSerializer(serializers.ModelSerializer):
    # Declaramos que un pedido va a recibir una lista de detalles
    detalles = DetallePedidoSerializer(many=True)

    class Meta:
        model = Pedido
        fields = ['id', 'nombre_cliente', 'email', 'direccion', 'ciudad', 'total', 'estado', 'fecha_creacion', 'detalles']
        read_only_fields = ['estado', 'fecha_creacion']

    # Magia de Django: Le enseñamos cómo guardar el ticket y sus líneas a la vez
    def create(self, validated_data):
        # 1. Sacamos los detalles de la mochila
        detalles_data = validated_data.pop('detalles')
        
        # 2. Creamos el Pedido (El ticket padre)
        pedido = Pedido.objects.create(**validated_data)
        
        # 3. Recorremos los detalles y los guardamos asociándolos al ticket padre
        for detalle_data in detalles_data:
            DetallePedido.objects.create(pedido=pedido, **detalle_data)
            
        return pedido
    
class VentaProductorSerializer(serializers.ModelSerializer):
    # Traemos datos de otras tablas a través de las relaciones (ForeignKey)
    nombre_producto = serializers.CharField(source='producto.nombre', read_only=True)
    fecha_pedido = serializers.DateTimeField(source='pedido.fecha_creacion', read_only=True)
    nombre_cliente = serializers.CharField(source='pedido.nombre_cliente', read_only=True)
    estado_pedido = serializers.CharField(source='pedido.estado', read_only=True)

    class Meta:
        model = DetallePedido
        fields = ['id', 'nombre_producto', 'cantidad', 'precio_unitario', 'fecha_pedido', 'nombre_cliente', 'estado_pedido']