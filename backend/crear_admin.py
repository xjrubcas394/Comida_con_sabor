import os
import django

# Cargamos el motor de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Leemos las variables que pusiste en Render
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'jaime@tfg.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin123!')

try:
    # Buscamos al usuario. Si no existe, lo creamos a la fuerza
    user, created = User.objects.get_or_create(email=email)
    
    # Le machacamos la contraseña y le damos todos los poderes
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    
    # Si tienes un campo de rol en tu modelo, lo rellenamos para evitar errores
    if hasattr(user, 'rol'):
        user.rol = 'Administrador' 
        
    user.save()

    if created:
        print(f"✅ ¡ÉXITO! Superusuario {email} creado a la fuerza.")
    else:
        print(f"✅ ¡ÉXITO! Superusuario {email} ya existía. Contraseña actualizada.")

except Exception as e:
    print(f"❌ ERROR creando el admin: {e}")