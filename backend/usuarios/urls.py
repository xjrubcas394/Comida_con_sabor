from django.urls import path
from .views import GestionUsuariosView

urlpatterns = [
    path('gestion/', GestionUsuariosView.as_view(), name='gestion-usuarios'),
    path('gestion/<int:pk>/', GestionUsuariosView.as_view(), name='modificar-usuario'),
]