from rest_framework import viewsets, permissions, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import Categoria, Producto, ProductoImagen, Pedido, DetallePedido
from .serializers import CategoriaSerializer, ProductoSerializer, PedidoSerializer, VentaProductorSerializer, RegistroSerializer
from django.db.models import Q
from django.conf import settings
import urllib.request
import json
from urllib.error import URLError, HTTPError

# Create your views here.
class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'categoria__nombre']

    def get_queryset(self):
        user = self.request.user
        
        # Si no hay usuario logueado, solo ve los aprobados
        if not user.is_authenticated:
            return Producto.objects.filter(estado_moderacion='Aprobado')
            
        # El Administrador puede ver y operar todo
        if user.rol == 'Administrador':
            if self.request.query_params.get('pendientes') == 'true':
                return Producto.objects.filter(estado_moderacion='Pendiente')
            return Producto.objects.all()
            
        # El Productor ve los aprobados del catálogo sus propios productos
        if user.rol == 'Productor':
            if self.request.query_params.get('propios') == 'true':
                return Producto.objects.filter(productor=user)
            return Producto.objects.filter(Q(estado_moderacion='Aprobado') | Q(productor=user))
            
        # El Cliente normal solo ve los aprobados
        return Producto.objects.filter(estado_moderacion='Aprobado')

    def perform_create(self, serializer):
        serializer.save(productor=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def moderar(self, request, pk=None):
        if request.user.rol != 'Administrador':
            return Response({"error": "No tienes permiso para moderar productos."}, status=403)
            
        producto = self.get_object()
        nuevo_estado = request.data.get('estado_moderacion')
        
        if nuevo_estado in ['Aprobado', 'Rechazado']:
            producto.estado_moderacion = nuevo_estado
            producto.save()
            return Response({'status': f'Producto marcado como {nuevo_estado}'})
            
        return Response({'error': 'Estado no válido'}, status=400)

    @action(detail=True, methods=['post'])
    def subir_imagen(self, request, pk=None):
        producto = self.get_object()
        imagen_archivo = request.FILES.get('imagen')
        
        if imagen_archivo:
            ProductoImagen.objects.create(
                producto=producto, 
                imagen=imagen_archivo, 
                es_principal=True
            )
            return Response({'status': 'Imagen subida correctamente'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'No se detectó ningún archivo'}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def maridaje(self, request, pk=None):
        producto = self.get_object()
        
        # 1. Ruta directa y clásica al modelo (sin el /v1/chat/completions)
        API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
        api_key = getattr(settings, 'HUGGINGFACE_API_KEY', '')
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # 2. Formato de etiquetas exacto que exige Zephyr
        prompt_formateado = (
            "<|system|>\nEres un experto sumiller y gastrónomo. Responde siempre en español. Escribe un maridaje perfecto, en un máximo de 3 líneas breves, para el producto que te indique el usuario.</s>\n"
            f"<|user|>\nProducto: {producto.nombre}. Descripción: {producto.historia or 'Sin descripción'}.</s>\n"
            "<|assistant|>\n"
        )
        
        payload = {
            "inputs": prompt_formateado,
            "parameters": {
                "max_new_tokens": 150, 
                "temperature": 0.7,
                "return_full_text": False
            }
        }
        
        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(API_URL, data=data, headers=headers)
            
            with urllib.request.urlopen(req) as response:
                if response.getcode() == 200:
                    respuesta_json = json.loads(response.read().decode('utf-8'))
                    respuesta_ia = respuesta_json[0]['generated_text'].strip()
                    return Response({'recomendacion': respuesta_ia})
                else:
                    return Response({'error': 'La IA está saturada, reintenta en unos segundos.'}, status=503)
                    
        except HTTPError as e:
            error_body = e.read().decode('utf-8')
            return Response({'error': f'Error de IA (HTTP {e.code}): {error_body}'}, status=500)
        except URLError as e:
            return Response({'error': f'Error de red: {str(e)}'}, status=500)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated] 
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def marcar_enviado(self, request, pk=None):
        pedido = self.get_object()
        pedido.estado = 'Enviado'
        pedido.save()
        return Response({'status': 'Pedido marcado como enviado'})

class MisVentasList(generics.ListAPIView):
    serializer_class = VentaProductorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DetallePedido.objects.filter(producto__productor=self.request.user).order_by('-pedido__fecha_creacion')
    
class RegistroUsuarioView(generics.CreateAPIView):
    User = get_user_model()
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegistroSerializer

class UsuarioActualView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "email": request.user.email,
            "rol": request.user.rol
        })