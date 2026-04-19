# Usamos una imagen oficial de Node.js
FROM node:20-slim

# Directorio de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias (si existen)
COPY package*.json ./

# Instalamos dependencias
RUN if [ -f "package.json" ]; then npm install; fi

# Copiamos el resto del código
COPY . .

# Exponemos el puerto estándar de Vite (React)
EXPOSE 5173

# Arrancamos el servidor de desarrollo de Vite permitiendo conexiones externas
CMD ["npm", "run", "dev", "--", "--host"]