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
        
        # 1. Obtenemos la clave y montamos la URL de Gemini
        api_key = getattr(settings, 'GOOGLE_API_KEY', '')
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        headers = {'Content-Type': 'application/json'}
        
        # 2. El Prompt: Le damos el rol de sumiller y los datos del producto
        prompt = (
            f"Eres un sumiller experto. Responde en español en un máximo de 2 líneas. "
            f"¿Con qué marida mejor este producto artesanal? "
            f"Nombre: {producto.nombre}. Historia: {producto.historia or 'Sin descripción'}."
        )
        
        # 3. Formato JSON específico que exige Google
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                respuesta_json = response.json()
                respuesta_ia = respuesta_json['candidates'][0]['content']['parts'][0]['text'].strip()
                return Response({'recomendacion': respuesta_ia})
            else:
                raise Exception(f"Error HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"Fallo en IA, activando salvavidas: {str(e)}")
            
            respuestas_simuladas = [
                f"Este excelente producto ({producto.nombre}) marida a la perfección con un vino tinto joven de la tierra y pan rústico.",
                f"Nuestra recomendación para disfrutar al máximo de {producto.nombre} es acompañarlo con un vino blanco muy frío.",
                f"El perfil de sabor de {producto.nombre} combina de manera increíble con una cerveza artesanal tostada."
            ]
            
            return Response({'recomendacion': random.choice(respuestas_simuladas)})

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