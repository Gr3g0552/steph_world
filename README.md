# Steph World

Plateforme web personnalisée avec interface utilisateur publique et console d'administration.

## Architecture

- **Backend** : Node.js/Express avec API REST
- **Frontend** : React avec animations modernes
- **Base de données** : SQLite
- **Sécurité** : Bcrypt pour mots de passe, JWT pour authentification

## Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Démarrage

```bash
# Backend (port 5000)
cd backend
npm start

# Frontend (port 3000)
cd frontend
npm start
```

## Sécurité

- Mots de passe chiffrés avec bcrypt (algorithme 2026)
- Authentification JWT
- Interface admin accessible uniquement localement
- Validation et sanitization des données

## Structure

- `/backend` - API REST et logique métier
- `/frontend` - Interface React (utilisateur + admin)
- `/database` - Schéma et migrations SQLite

