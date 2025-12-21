# 🔧 Guide de Dépannage - Steph World

## Problème de Connexion

### Erreur : "Account pending approval"

Si vous ne pouvez pas vous connecter avec le compte admin, c'est que le compte n'est pas approuvé dans la base de données.

#### Solution :

```bash
cd /home/steph/steph_world

# Approuver le compte admin
sudo docker compose exec backend sh -c "cd /app && node -e \"const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('/app/data/steph_world.db'); db.run('UPDATE users SET is_approved = 1 WHERE email = ?', ['gregory.monsoro@gmail.com'], function(err) { if (err) console.error(err); else console.log('Admin account approved'); db.close(); });\""
```

### Vérifier les utilisateurs dans la base de données

```bash
sudo docker compose exec backend sh -c "cd /app && node -e \"const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('/app/data/steph_world.db'); db.all('SELECT email, username, role, is_approved FROM users', [], (err, rows) => { if (err) console.error(err); else console.log(JSON.stringify(rows, null, 2)); db.close(); });\""
```

### Réinitialiser complètement la base de données

```bash
cd /home/steph/steph_world

# Supprimer la base de données
rm database/steph_world.db

# Redémarrer les conteneurs (la base sera réinitialisée automatiquement)
sudo docker compose restart backend
```

## Problèmes de Connexion au Site

### Le site ne charge pas

1. **Vérifier que les conteneurs sont démarrés** :
```bash
sudo docker compose ps
```

2. **Vérifier les ports** :
```bash
sudo netstat -tlnp | grep -E ":3000|:5000"
```

3. **Voir les logs d'erreur** :
```bash
sudo docker compose logs backend
sudo docker compose logs frontend
```

### Erreur CORS dans le navigateur

Vérifiez que le frontend peut communiquer avec le backend. Le backend doit autoriser les requêtes depuis `http://localhost:3000`.

### Le backend ne répond pas

```bash
# Tester le backend
curl http://localhost:5000/api/health

# Redémarrer le backend
sudo docker compose restart backend

# Voir les logs
sudo docker compose logs -f backend
```

## Problèmes de Base de Données

### La base de données est corrompue

```bash
# Arrêter les conteneurs
sudo docker compose down

# Supprimer la base de données
rm database/steph_world.db

# Redémarrer
sudo docker compose up -d
```

### Réinitialiser avec le script

```bash
cd /home/steph/steph_world
sudo docker compose exec backend sh -c "cd /app && DB_PATH=/app/data/steph_world.db node init-db.js"
```

## Commandes Utiles

```bash
# Voir tous les logs
sudo docker compose logs -f

# Redémarrer tout
sudo docker compose restart

# Rebuild complet
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d

# Accéder au shell du backend
sudo docker compose exec backend sh

# Accéder au shell du frontend
sudo docker compose exec frontend sh
```

