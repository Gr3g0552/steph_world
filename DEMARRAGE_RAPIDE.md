# 🚀 Démarrage Rapide - Steph World

## Avec Docker (Recommandé)

### 1. Démarrer le projet

```bash
cd /home/steph/steph_world
sudo ./start.sh
```

Ou manuellement :
```bash
sudo docker compose up -d --build
```

### 2. Initialiser la base de données (première fois)

```bash
sudo docker compose exec backend sh -c "cd /app && node database/init.js"
```

### 3. Accéder aux interfaces

- **Interface Utilisateur** : http://localhost:3000
- **Interface Admin** : http://localhost:3000/admin
  - Email : `gregory.monsoro@gmail.com`
  - Mot de passe : `Admin123!`

### 4. Commandes utiles

```bash
# Voir les logs
sudo docker compose logs -f

# Arrêter
sudo docker compose down
# ou
./stop.sh

# Redémarrer
sudo docker compose restart

# Rebuild
sudo docker compose up -d --build
```

## Sans Docker (Développement)

### 1. Installer Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Installer les dépendances

```bash
cd /home/steph/steph_world
npm run install-all
```

### 3. Initialiser la base de données

```bash
npm run init-db
```

### 4. Démarrer

**Terminal 1 - Backend :**
```bash
npm run start-backend
```

**Terminal 2 - Frontend :**
```bash
npm run start-frontend
```

## Accès depuis un autre appareil

Si vous voulez accéder depuis un autre appareil sur le même réseau :

1. Trouvez l'IP de votre Raspberry Pi :
```bash
hostname -I
```

2. Accédez via :
- Interface Utilisateur : `http://IP_RASPBERRY:3000`
- Interface Admin : `http://IP_RASPBERRY:3000/admin`

3. Pour Docker, modifiez `docker-compose.yml` :
```yaml
ports:
  - "0.0.0.0:3000:80"  # Frontend
  - "0.0.0.0:5000:5000"  # Backend
```

## Dépannage

### Docker ne démarre pas
```bash
# Vérifier que Docker fonctionne
sudo docker ps

# Voir les logs d'erreur
sudo docker compose logs
```

### Port déjà utilisé
```bash
# Trouver le processus
sudo lsof -i :3000
sudo lsof -i :5000

# Arrêter le processus
sudo kill -9 PID
```

### Base de données corrompue
```bash
# Supprimer et réinitialiser
rm database/steph_world.db
sudo docker compose exec backend sh -c "cd /app && node database/init.js"
```

