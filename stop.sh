#!/bin/bash

# Script d'arrêt pour Steph World

set -e

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
    COMPOSE_CMD="sudo $COMPOSE_CMD"
fi

cd "$(dirname "$0")"

echo "🛑 Arrêt de Steph World..."
$COMPOSE_CMD down

echo "✅ Services arrêtés."

