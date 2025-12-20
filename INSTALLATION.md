# Guide d'Installation - Steph World

## Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn
- SQLite3

## Installation

### 1. Installation des dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configuration

Copiez le fichier `.env.example` vers `.env` dans le dossier backend et modifiez les valeurs si nécessaire :

```bash
cd backend
cp .env.example .env
```

### 3. Initialisation de la base de données

```bash
cd database
node init.js
```

Cela créera :
- La base de données SQLite
- Le compte administrateur par défaut (gregory.monsoro@gmail.com)
- Les catégories par défaut (Arts, Vidéos, Memes)

**Mot de passe admin par défaut :** `Admin123!`
⚠️ **IMPORTANT :** Changez ce mot de passe lors de la première connexion !

### 4. Démarrage

#### Backend (Terminal 1)
```bash
cd backend
npm start
# ou pour le développement avec auto-reload
npm run dev
```

Le backend sera accessible sur `http://localhost:5000`

#### Frontend (Terminal 2)
```bash
cd frontend
npm start
```

Le frontend sera accessible sur `http://localhost:3000`

## Accès

- **Interface Utilisateur :** http://localhost:3000
- **Interface Admin :** http://localhost:3000/admin
- **API Backend :** http://localhost:5000/api

## Compte Administrateur

- **Email :** gregory.monsoro@gmail.com
- **Mot de passe initial :** Admin123!
- ⚠️ **Changez ce mot de passe immédiatement après la première connexion !**

## Structure du Projet

```
steph_world/
├── backend/          # API REST Node.js/Express
├── frontend/         # Interface React
├── database/         # Schéma SQLite et scripts d'initialisation
└── README.md
```

## Sécurité

- Les mots de passe sont chiffrés avec bcrypt (12 rounds)
- Authentification JWT
- Protection des routes admin
- Validation et sanitization des données
- Rate limiting sur l'API

## Production

Pour la production :

1. Modifiez `JWT_SECRET` dans `.env` avec une clé sécurisée
2. Configurez `NODE_ENV=production`
3. Build du frontend : `cd frontend && npm run build`
4. Servez le frontend avec un serveur web (nginx, Apache, etc.)
5. Gardez l'interface admin en local uniquement

