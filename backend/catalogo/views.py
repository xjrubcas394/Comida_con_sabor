from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Categoria, Producto, ProductoImagen
from .serializers import CategoriaSerializer, ProductoSerializer

# Create your views here.
class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    # Usamos ReadOnly para que desde React solo se puedan leer las categorías (se crean desde el panel admin)
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    # Solo usuarios logueados pueden interactuar con esta API de gestión
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.request.query_params.get('propios') == 'true' and self.request.user.is_authenticated:
            return Producto.objects.filter(productor=self.request.user)
        
        return Producto.objects.filter(estado_moderacion='Aprobado')
    
    def perform_create(self, serializer):
        serializer.save(productor=self.request.user)

    @action(detail=True, methods=['post'])
    def subir_imagen(self, request, pk=None):
        producto = self.get_object()
        imagen_archivo = request.FILES.get('imagen')
        
        if imagen_archivo:
            # Creamos registro en la tabla de imagenes y lo marcamos como principal
            ProductoImagen.objects.create(
                producto=producto, 
                imagen=imagen_archivo, 
                es_principal=True
            )
            return Response({'status': 'Imagen subida correctamente'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'No se detectó ningún archivo'}, status=status.HTTP_400_BAD_REQUEST)