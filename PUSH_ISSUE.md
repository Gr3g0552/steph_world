# Problème de Push vers GitHub

## Situation actuelle

Le dépôt existe sur GitHub (https://github.com/Gr3g0552/steph_world), mais le push échoue avec une erreur 403.

## Cause probable

Le token d'accès personnel n'a probablement pas les permissions nécessaires (scope `repo` complet).

## Solution

### Option 1 : Vérifier et mettre à jour le token

1. Allez sur https://github.com/settings/tokens
2. Trouvez le token `steph_world` (ou créez-en un nouveau)
3. Assurez-vous que le scope **`repo`** est coché (accès complet aux dépôts)
4. Si vous créez un nouveau token, copiez-le et utilisez-le

### Option 2 : Utiliser GitHub CLI (Recommandé)

```bash
# Installer GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Se connecter
gh auth login

# Pousser
cd /home/steph/steph_world
git push -u origin master
```

### Option 3 : Utiliser SSH

1. Générer une clé SSH :
```bash
ssh-keygen -t ed25519 -C "gregory.monsoro@gmail.com"
```

2. Afficher la clé publique :
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Ajouter la clé sur GitHub :
   - https://github.com/settings/keys
   - "New SSH key"
   - Coller la clé

4. Changer le remote :
```bash
cd /home/steph/steph_world
git remote set-url origin git@github.com:Gr3g0552/steph_world.git
git push -u origin master
```

## Vérification

Après avoir résolu le problème, vérifiez sur :
https://github.com/Gr3g0552/steph_world

