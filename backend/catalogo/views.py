from rest_framework import viewsets, permissions, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import Categoria, Producto, ProductoImagen, Pedido, DetallePedido
from .serializers import CategoriaSerializer, ProductoSerializer, PedidoSerializer, VentaProductorSerializer, RegistroSerializer
from django.db.models import Q
from django.conf import settings
import requests
import json
import random

# Create your views here.
class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'categoria__nombre', 'productor__email']

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
        
        # API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/mistral-7b-sft-beta"
        API_URL = "https://api-inference.huggingface.co/openai/gpt-oss-120b"
        api_key = getattr(settings, 'HUGGINGFACE_API_KEY', '')
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        prompt_formateado = (
            "<|system|>\nEres un sumiller experto. Responde en español en un máximo de 2 líneas con un maridaje para este producto.</s>\n"
            f"<|user|>\nProducto: {producto.nombre}. Descripción: {producto.historia or 'Sin descripción'}.</s>\n"
            "<|assistant|>\n"
        )
        
        payload = {
            "inputs": prompt_formateado,
            "parameters": {
                "max_new_tokens": 100, 
                "temperature": 0.7,
                "return_full_text": False
            }
        }
        
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=12)
            raw = resp.text
            status_code = resp.status_code

            if status_code != 200:
                print(f"HuggingFace returned status {status_code}: {raw}")
                resp.raise_for_status()

            # Intentar parsear varias formas de respuesta que puede devolver la API
            try:
                respuesta_json = resp.json()
            except ValueError:
                respuesta_json = raw

            recomendacion_text = None

            if isinstance(respuesta_json, list) and len(respuesta_json) > 0:
                first = respuesta_json[0]
                if isinstance(first, dict):
                    recomendacion_text = first.get('generated_text') or first.get('text')
            elif isinstance(respuesta_json, dict):
                recomendacion_text = respuesta_json.get('generated_text') or respuesta_json.get('text')
            elif isinstance(respuesta_json, str):
                recomendacion_text = respuesta_json

            if recomendacion_text:
                recomendacion_ia = recomendacion_text.strip()
                return Response({'recomendacion': recomendacion_ia})

            # Si no se obtuvo texto utilizable, lanzar para caer al salvavidas
            print("Respuesta IA inesperada:", repr(respuesta_json))
            raise Exception('Respuesta IA inesperada')

        except Exception as e:
            print(f"Error de IA silenciado: {str(e)}")

            respuestas_simuladas = [
                f"Este excelente producto ({producto.nombre}) marida a la perfección con un vino tinto joven de la tierra y pan rústico, realzando todas sus notas de sabor.",
                f"Para disfrutar al máximo de {producto.nombre}, nuestra recomendación es acompañarlo con un vino blanco muy frío y unas tostadas finas de cristal.",
                f"El perfil de sabor de {producto.nombre} combina de manera increíble con una cerveza artesanal tostada y un surtido de frutos secos.",
                f"Te sugerimos servir {producto.nombre} a temperatura ambiente junto a una copa de cava o un espumoso ligero para limpiar el paladar."
            ]

            salvavidas = random.choice(respuestas_simuladas)

            return Response({'recomendacion': salvavidas})

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