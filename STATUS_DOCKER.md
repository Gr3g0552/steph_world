# ✅ Status Docker - Steph World

## 🎉 Projet Opérationnel !

### Conteneurs en cours d'exécution

- ✅ **Backend** : `steph_world_backend` - Port 5000
- ✅ **Frontend** : `steph_world_frontend` - Port 3000

### Accès aux Interfaces

#### Depuis la Raspberry Pi (localhost)
- **Interface Utilisateur** : http://localhost:3000
- **Interface Admin** : http://localhost:3000/admin
- **Backend API** : http://localhost:5000/api

#### Depuis un autre appareil sur le réseau
- **IP Raspberry Pi** : 192.168.178.51
- **Interface Utilisateur** : http://192.168.178.51:3000
- **Interface Admin** : http://192.168.178.51:3000/admin
- **Backend API** : http://192.168.178.51:5000/api

### Identifiants Admin

- **Email** : gregory.monsoro@gmail.com
- **Mot de passe** : Admin123!
- ⚠️ **Changez le mot de passe lors de la première connexion !**

### Commandes Utiles

```bash
# Voir le statut
sudo docker compose ps

# Voir les logs
sudo docker compose logs -f
sudo docker compose logs -f backend
sudo docker compose logs -f frontend

# Arrêter
sudo docker compose down

# Redémarrer
sudo docker compose restart

# Rebuild
sudo docker compose build
sudo docker compose up -d
```

### Architecture

- **Backend** : Node.js 18 Alpine (ARM64)
- **Frontend** : React + Nginx Alpine (ARM64)
- **Base de données** : SQLite (persistante dans `./database/`)
- **Uploads** : Persistants dans `./frontend/public/uploads/`

### Vérification

```bash
# Backend
curl http://localhost:5000/api/health

# Frontend
curl -I http://localhost:3000
```

---

**Date de démarrage** : $(date)
**Status** : ✅ Opérationnel

