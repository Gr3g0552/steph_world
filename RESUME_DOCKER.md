# ✅ Configuration Docker Complète - Steph World

## 📦 Ce qui a été créé

### Fichiers Docker
- ✅ `docker-compose.yml` - Configuration production
- ✅ `docker-compose.dev.yml` - Configuration développement
- ✅ `backend/Dockerfile` - Image backend
- ✅ `backend/Dockerfile.dev` - Image backend (dev)
- ✅ `frontend/Dockerfile` - Image frontend (production avec nginx)
- ✅ `frontend/Dockerfile.dev` - Image frontend (dev)
- ✅ `frontend/nginx.conf` - Configuration nginx
- ✅ `.dockerignore` - Fichiers à ignorer
- ✅ `start.sh` - Script de démarrage automatique
- ✅ `stop.sh` - Script d'arrêt

### Documentation
- ✅ `DOCKER.md` - Guide complet Docker
- ✅ `DEMARRAGE_RAPIDE.md` - Guide de démarrage rapide
- ✅ `ACCES_CONSOLES.md` - Guide d'accès aux interfaces

## 🚀 Démarrage

### Option 1 : Script automatique
```bash
cd /home/steph/steph_world
sudo ./start.sh
```

### Option 2 : Docker Compose manuel
```bash
cd /home/steph/steph_world

# Build et démarrage
sudo docker compose up -d --build

# Initialiser la base de données (première fois)
sudo docker compose exec backend sh -c "cd /app && node database/init.js"

# Voir les logs
sudo docker compose logs -f
```

## 🌐 Accès

Une fois démarré :
- **Interface Utilisateur** : http://localhost:3000
- **Interface Admin** : http://localhost:3000/admin
  - Email : `gregory.monsoro@gmail.com`
  - Mot de passe : `Admin123!`

## 📋 Commandes Utiles

```bash
# Voir les conteneurs
sudo docker compose ps

# Voir les logs
sudo docker compose logs -f
sudo docker compose logs -f backend
sudo docker compose logs -f frontend

# Arrêter
sudo docker compose down
# ou
./stop.sh

# Redémarrer
sudo docker compose restart

# Rebuild complet
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d
```

## 🔧 Dépannage

### Les conteneurs ne démarrent pas
```bash
# Voir les erreurs
sudo docker compose logs

# Vérifier les images
sudo docker images | grep steph_world

# Rebuild
sudo docker compose build --no-cache
```

### Port déjà utilisé
```bash
# Trouver le processus
sudo lsof -i :3000
sudo lsof -i :5000

# Arrêter
sudo kill -9 PID
```

### Base de données
```bash
# Réinitialiser
rm database/steph_world.db
sudo docker compose exec backend sh -c "cd /app && node database/init.js"
```

## 📝 Notes

- Les données sont persistantes dans `./database/` et `./frontend/public/uploads/`
- Le backend initialise automatiquement la base de données au premier démarrage
- Utilisez `docker-compose.dev.yml` pour le développement avec hot-reload

