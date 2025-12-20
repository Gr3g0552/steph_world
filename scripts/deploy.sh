#!/bin/bash

# Script de déploiement pour Steph World
# Ce script pousse les changements vers GitHub

set -e

echo "🚀 Déploiement de Steph World..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Vérifier le statut Git
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Fichiers modifiés détectés..."
    git add -A
    read -p "Message de commit: " commit_message
    git commit -m "$commit_message"
fi

# Push vers GitHub
echo "📤 Envoi vers GitHub..."
git push origin master || git push origin main

echo "✅ Déploiement terminé avec succès!"

