FROM node:18-alpine

WORKDIR /app

# Installer wget pour healthcheck
RUN apk add --no-cache wget

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Copier le script d'initialisation de la base de données (sera copié avec COPY . .)

# Exposer le port
EXPOSE 5000

# Commande par défaut
CMD ["npm", "start"]
