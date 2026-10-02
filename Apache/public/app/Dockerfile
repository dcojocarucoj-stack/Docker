# Usa una imagen oficial ligera de Node.js
FROM node:20-alpine

# Define el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de definición de dependencias primero
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto que usa tu aplicación de Node (ej. 3000)
EXPOSE 8443

# Comando para arrancar la aplicación
CMD ["npm", "run", "dev"]