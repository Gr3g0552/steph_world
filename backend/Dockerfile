FROM node:18-alpine

WORKDIR /app

# Installer wget pour healthcheck
RUN apk add --no-cache wget

# Copier les fichiers de dépendances backend
COPY backend/package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code backend
COPY backend/ ./

# Copier le dossier database pour l'initialisation
COPY database/ ../database/

# Exposer le port
EXPOSE 5000

# Commande par défaut
CMD ["npm", "start"]
