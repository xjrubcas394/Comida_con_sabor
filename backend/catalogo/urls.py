from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ProductoViewSet, PedidoViewSet, MisVentasList

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'pedidos', PedidoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('mis-ventas/', MisVentasList.as_view(), name='mis-ventas'),
]