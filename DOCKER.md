# Guide Docker - Steph World

## 🐳 Démarrage avec Docker

### Prérequis
- Docker installé
- Docker Compose installé

### Démarrage Rapide (Production)

```bash
cd /home/steph/steph_world

# 1. Initialiser la base de données (première fois)
docker-compose run --rm backend node ../database/init.js

# 2. Démarrer tous les services
docker-compose up -d

# 3. Voir les logs
docker-compose logs -f
```

**Accès :**
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000
- Interface Admin : http://localhost:3000/admin

### Démarrage en Mode Développement

```bash
cd /home/steph/steph_world

# Démarrer avec hot-reload
docker-compose -f docker-compose.dev.yml up

# En arrière-plan
docker-compose -f docker-compose.dev.yml up -d
```

### Commandes Utiles

```bash
# Arrêter les conteneurs
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Rebuild les images
docker-compose build

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Exécuter une commande dans un conteneur
docker-compose exec backend sh
docker-compose exec frontend sh

# Redémarrer un service
docker-compose restart backend
docker-compose restart frontend

# Voir le statut
docker-compose ps
```

### Initialisation de la Base de Données

```bash
# Première fois
docker-compose run --rm backend node ../database/init.js

# Ou manuellement
docker-compose exec backend sh
cd /app
node ../database/init.js
```

### Variables d'Environnement

Créez un fichier `.env` à la racine :

```env
JWT_SECRET=votre_secret_jwt_tres_securise
NODE_ENV=production
```

### Volumes Persistants

Les données sont stockées dans :
- `./database/` - Base de données SQLite
- `./frontend/public/uploads/` - Fichiers uploadés

### Accès depuis d'autres appareils

Modifiez `docker-compose.yml` pour exposer sur toutes les interfaces :

```yaml
ports:
  - "0.0.0.0:3000:80"  # Frontend
  - "0.0.0.0:5000:5000"  # Backend
```

Puis accédez via : `http://IP_RASPBERRY:3000`

### Dépannage

```bash
# Voir les logs d'erreur
docker-compose logs backend
docker-compose logs frontend

# Rebuild complet
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Vérifier les conteneurs
docker ps
docker-compose ps

# Nettoyer
docker-compose down -v
docker system prune -a
```

