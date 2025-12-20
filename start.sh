#!/bin/bash

# Script de démarrage pour Steph World avec Docker

set -e

echo "🚀 Démarrage de Steph World avec Docker..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier docker-compose et permissions
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose n'est pas installé."
    exit 1
fi

# Vérifier les permissions Docker
if ! docker ps &> /dev/null; then
    echo "⚠️  Permissions Docker insuffisantes. Utilisation de sudo..."
    COMPOSE_CMD="sudo $COMPOSE_CMD"
    DOCKER_CMD="sudo docker"
else
    DOCKER_CMD="docker"
fi

cd "$(dirname "$0")"

# Créer les dossiers nécessaires
mkdir -p database frontend/public/uploads

# Démarrer les services
echo "📦 Démarrage des conteneurs..."
$COMPOSE_CMD up -d --build

# Attendre que le backend soit prêt
echo "⏳ Attente du démarrage du backend..."
sleep 5

# Initialiser la base de données si nécessaire
if [ ! -f database/steph_world.db ]; then
    echo "🗄️  Initialisation de la base de données..."
    sleep 10
    $COMPOSE_CMD exec -T backend sh -c "cd /app && node database/init.js" || echo "⚠️  Erreur lors de l'initialisation, mais le conteneur continue..."
fi

echo ""
echo "✅ Steph World est démarré !"
echo ""
echo "📱 Accès aux interfaces :"
echo "   - Interface Utilisateur : http://localhost:3000"
echo "   - Interface Admin : http://localhost:3000/admin"
echo "   - Backend API : http://localhost:5000"
echo ""
echo "📋 Commandes utiles :"
echo "   - Voir les logs : $COMPOSE_CMD logs -f"
echo "   - Arrêter : $COMPOSE_CMD down"
echo "   - Redémarrer : $COMPOSE_CMD restart"
echo ""

