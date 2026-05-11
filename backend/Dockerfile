# Usamos una imagen oficial y ligera de Python
FROM python:3.11-slim

# Evita que Python escriba archivos .pyc y fuerza a que la salida de la consola no se bloquee
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar ciertas librerías (como psycopg2 para PostgreSQL)
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && apt-get clean

# Copiamos e instalamos los requerimientos
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiamos el resto del código
COPY . /app/

# Exponemos el puerto estándar de Django
EXPOSE 8000

# Comando por defecto (se sobreescribirá en el docker-compose para desarrollo)
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]