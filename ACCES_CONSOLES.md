# Guide d'Accès aux Consoles - Steph World

## 🚀 Démarrage Rapide

### 1. Installation (Première fois uniquement)

```bash
cd /home/steph/steph_world

# Installer les dépendances
npm run install-all

# Initialiser la base de données
npm run init-db
```

### 2. Démarrer les Services

Vous avez besoin de **2 terminaux** :

#### Terminal 1 - Backend (API)
```bash
cd /home/steph/steph_world
npm run start-backend
# ou pour le développement avec auto-reload
npm run dev-backend
```

Le backend démarre sur : **http://localhost:5000**

#### Terminal 2 - Frontend (Interface)
```bash
cd /home/steph/steph_world
npm run start-frontend
```

Le frontend démarre sur : **http://localhost:3000**

---

## 🖥️ Accès aux Interfaces

### Interface Utilisateur (Publique)
**URL :** http://localhost:3000

- Page d'accueil avec catégories
- Inscription/Connexion
- Publication de contenu
- Profils utilisateurs
- Likes et commentaires

### Interface Administrateur
**URL :** http://localhost:3000/admin

**Accès :**
- Email : `gregory.monsoro@gmail.com`
- Mot de passe initial : `Admin123!`
- ⚠️ **Changez le mot de passe lors de la première connexion !**

**Fonctionnalités Admin :**
- Gestion des utilisateurs (approbation, suppression)
- Gestion des catégories
- Gestion des publications
- Messages épinglés
- Configuration de la page d'accueil

### Basculer entre les Interfaces

Depuis votre profil administrateur, vous pouvez basculer entre :
- **Interface Utilisateur** : http://localhost:3000
- **Interface Admin** : http://localhost:3000/admin

Un bouton dans le header permet de changer d'interface.

---

## 📋 Vérification

### Vérifier que tout fonctionne :

1. **Backend actif :**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Devrait retourner : `{"status":"ok",...}`

2. **Frontend actif :**
   Ouvrez http://localhost:3000 dans votre navigateur

3. **Base de données :**
   ```bash
   ls -lh database/steph_world.db
   ```

---

## 🔧 Dépannage

### Le backend ne démarre pas :
- Vérifiez que le port 5000 n'est pas utilisé : `lsof -i :5000`
- Vérifiez que Node.js est installé : `node --version`

### Le frontend ne démarre pas :
- Vérifiez que le port 3000 n'est pas utilisé : `lsof -i :3000`
- Réinstallez les dépendances : `cd frontend && npm install`

### Erreur de base de données :
- Réinitialisez : `npm run init-db`

---

## 🌐 Accès depuis d'autres appareils (Raspberry Pi)

Si vous voulez accéder depuis un autre appareil sur le même réseau :

1. Trouvez l'IP de votre Raspberry Pi :
   ```bash
   hostname -I
   ```

2. Accédez via :
   - Interface Utilisateur : `http://IP_RASPBERRY:3000`
   - Interface Admin : `http://IP_RASPBERRY:3000/admin`

3. Pour que le frontend soit accessible, modifiez dans `frontend/package.json` :
   ```json
   "start": "HOST=0.0.0.0 react-scripts start"
   ```

---

## 📝 Commandes Utiles

```bash
# Voir les logs du backend
cd backend && npm start

# Voir les logs du frontend
cd frontend && npm start

# Arrêter les services
# Appuyez sur Ctrl+C dans chaque terminal

# Redémarrer tout
npm run start-backend  # Terminal 1
npm run start-frontend  # Terminal 2
```

