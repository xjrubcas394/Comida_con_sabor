# Usamos una imagen oficial y ligera de Python
FROM python:3.11-slim

# Evitamos que Python guarde caché basura y forzamos a que los logs se vean en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Creamos la carpeta del servidor
WORKDIR /app

# Copiamos e instalamos las librerías
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo tu código
COPY . /app/

# Recopilamos el CSS de tu panel de Administrador para que se vea bien
RUN python manage.py collectstatic --noinput

# Arrancamos Gunicorn
CMD gunicorn core.wsgi:application --bind 0.0.0.0:8000