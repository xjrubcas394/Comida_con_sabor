from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class Usuario(AbstractUser):
    ROLES = (
        ('Cliente', 'Cliente'),
        ('Productor', 'Productor'),
        ('Administrador', 'Administrador'),
    )
    
    nombre_completo = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    rol = models.CharField(max_length=20, choices=ROLES, default='Cliente')
    direccion = models.CharField(max_length=255, blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'nombre_completo']

    def __str__(self):
        return f"{self.nombre_completo} ({self.rol})"