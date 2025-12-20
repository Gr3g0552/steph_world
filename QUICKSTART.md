# Démarrage Rapide - Steph World

## Installation Express

```bash
# 1. Installer toutes les dépendances
npm run install-all

# 2. Initialiser la base de données
npm run init-db

# 3. Démarrer le backend (Terminal 1)
npm run start-backend

# 4. Démarrer le frontend (Terminal 2)
npm run start-frontend
```

## Première Connexion

1. Ouvrez http://localhost:3000
2. Connectez-vous avec :
   - **Email :** gregory.monsoro@gmail.com
   - **Mot de passe :** Admin123!
3. **⚠️ CHANGEZ LE MOT DE PASSE IMMÉDIATEMENT !**

## Fonctionnalités

### Interface Utilisateur
- ✅ Inscription/Connexion
- ✅ Publication d'images et vidéos
- ✅ Système de likes et commentaires
- ✅ Catégories : Arts, Vidéos, Memes
- ✅ Profils utilisateurs
- ✅ Animations et transitions modernes
- ✅ Fond animé avec images floutées

### Interface Admin
- ✅ Gestion des utilisateurs (approbation, suppression)
- ✅ Gestion des catégories et sous-catégories
- ✅ Gestion des publications
- ✅ Messages épinglés pour utilisateurs
- ✅ Configuration de la page d'accueil

## Structure

```
steph_world/
├── backend/          # API REST (port 5000)
├── frontend/         # React App (port 3000)
├── database/         # SQLite + scripts
└── scripts/          # Scripts utilitaires
```

## Déploiement vers GitHub

```bash
npm run deploy
# ou manuellement :
git add -A
git commit -m "Votre message"
git push origin master
```

## Sécurité

- ✅ Mots de passe chiffrés (bcrypt, 12 rounds)
- ✅ Authentification JWT
- ✅ Protection routes admin
- ✅ Rate limiting
- ✅ Validation des données
- ✅ .env ignoré par Git

## Support

Consultez `INSTALLATION.md` pour plus de détails.

