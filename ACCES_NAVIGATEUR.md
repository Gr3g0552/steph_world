# 🔍 Guide d'Accès au Projet depuis le Navigateur

## ✅ URL Correcte

**⚠️ Erreur dans votre URL :** Vous avez écrit `locoalhost` au lieu de `localhost`

### URLs Correctes :

#### Depuis la Raspberry Pi :
- ✅ **http://localhost:3000** (Interface Utilisateur)
- ✅ **http://localhost:3000/admin** (Interface Admin)
- ✅ **http://127.0.0.1:3000** (Alternative)

#### Depuis un autre appareil sur le réseau :
- ✅ **http://192.168.178.51:3000** (Interface Utilisateur)
- ✅ **http://192.168.178.51:3000/admin** (Interface Admin)

## 🔧 Vérifications

### 1. Vérifier que les conteneurs sont démarrés

```bash
cd /home/steph/steph_world
sudo docker compose ps
```

Vous devriez voir :
- `steph_world_backend` - Status: Up
- `steph_world_frontend` - Status: Up

### 2. Vérifier les ports

```bash
sudo netstat -tlnp | grep -E ":3000|:5000"
```

Les ports 3000 et 5000 doivent être en écoute.

### 3. Tester depuis le terminal

```bash
# Test backend
curl http://localhost:5000/api/health

# Test frontend
curl -I http://localhost:3000
```

## 🐛 Dépannage

### Le navigateur ne se connecte pas

1. **Vérifier le firewall** :
```bash
sudo ufw status
# Si actif, autoriser les ports :
sudo ufw allow 3000
sudo ufw allow 5000
```

2. **Redémarrer les conteneurs** :
```bash
cd /home/steph/steph_world
sudo docker compose restart
```

3. **Voir les logs d'erreur** :
```bash
sudo docker compose logs frontend
sudo docker compose logs backend
```

4. **Vérifier que nginx fonctionne** :
```bash
sudo docker compose exec frontend nginx -t
```

### Accès depuis un autre appareil

Si vous voulez accéder depuis un autre appareil sur le réseau :

1. Trouvez l'IP de votre Raspberry Pi :
```bash
hostname -I
```

2. Utilisez cette IP dans le navigateur :
```
http://IP_RASPBERRY:3000
```

3. Si ça ne fonctionne pas, vérifiez que les ports sont bien exposés sur toutes les interfaces (déjà configuré dans docker-compose.yml avec `0.0.0.0:3000`)

## 📝 Notes

- Le frontend écoute sur le port **3000** (mappé depuis le port 80 du conteneur)
- Le backend écoute sur le port **5000**
- Les conteneurs doivent être démarrés avec `sudo docker compose up -d`

