from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model

# Create your views here.
User = get_user_model()

class GestionUsuariosView(APIView):
    # La máxima seguridad: solo el is_staff/is_superuser puede entrar aquí
    permission_classes = [IsAdminUser] 

    def get(self, request):
        # Buscamos a todos los usuarios menos a ti mismo (para no quitarte tus propios poderes por error)
        usuarios = User.objects.exclude(id=request.user.id).values('id', 'email', 'nombre', 'apellidos', 'rol')
        return Response(list(usuarios))

    def patch(self, request, pk):
        try:
            usuario = User.objects.get(pk=pk)
            nuevo_rol = request.data.get('rol')
            
            # Validación de seguridad extra
            if nuevo_rol in ['Cliente', 'Productor', 'Administrador']:
                usuario.rol = nuevo_rol
                usuario.save()
                return Response({'mensaje': f'Rol de {usuario.email} actualizado a {nuevo_rol}'})
            else:
                return Response({'error': 'Rol no permitido'}, status=400)
                
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)