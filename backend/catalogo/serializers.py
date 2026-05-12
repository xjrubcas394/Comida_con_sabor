from rest_framework import serializers
from .models import Categoria, Producto, ProductoImagen, DetallePedido, Pedido
from django.contrib.auth import get_user_model

User = get_user_model()

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen', 'es_principal']

class ProductoSerializer(serializers.ModelSerializer):
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    
    productor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'historia', 'precio', 'stock', 'region_origen',
            'es_km0', 'es_organico', 'estado_moderacion',
            'categoria', 'categoria_nombre', 'productor', 'productor_nombre',
            'imagenes'
        ]
        read_only_fields = ['productor', 'estado_moderacion']

    def get_productor_nombre(self, obj):
        nombre = f"{obj.productor.first_name} {obj.productor.last_name}".strip()
        return nombre if nombre else obj.productor.email

class DetallePedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePedido
        fields = ['producto', 'cantidad', 'precio_unitario']

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True)

    class Meta:
        model = Pedido
        fields = ['id', 'nombre_cliente', 'email', 'direccion', 'ciudad', 'total', 'estado', 'fecha_creacion', 'detalles']
        read_only_fields = ['estado', 'fecha_creacion']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        
        pedido = Pedido.objects.create(**validated_data)
        
        for detalle_data in detalles_data:
            DetallePedido.objects.create(pedido=pedido, **detalle_data)
            
        return pedido
    
class VentaProductorSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.CharField(source='producto.nombre', read_only=True)
    fecha_pedido = serializers.DateTimeField(source='pedido.fecha_creacion', read_only=True)
    
    nombre_cliente = serializers.CharField(source='pedido.nombre_cliente', read_only=True)
    direccion_cliente = serializers.CharField(source='pedido.direccion', read_only=True)
    ciudad_cliente = serializers.CharField(source='pedido.ciudad', read_only=True)
    
    estado_pedido = serializers.CharField(source='pedido.estado', read_only=True)
    pedido_id = serializers.IntegerField(source='pedido.id', read_only=True)

    class Meta:
        model = DetallePedido
        fields = ['id', 'pedido_id', 'nombre_producto', 'cantidad', 'precio_unitario', 'fecha_pedido', 'nombre_cliente', 'direccion_cliente', 'ciudad_cliente', 'estado_pedido']

class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name'] 

    def create(self, validated_data):
        email = validated_data.get('email', '')
        
        user = User.objects.create_user(
            username=email, 
            email=email,
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user