from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

# Register your models here.
@admin.register(Usuario)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'nombre_completo', 'rol', 'is_staff')
    list_filter = ('rol', 'is_staff', 'is_active')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('rol', 'direccion')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('email', 'nombre_completo', 'rol', 'direccion')}),
    )
