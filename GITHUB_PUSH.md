# Guide pour pousser le projet sur GitHub

## Option 1 : Utiliser un Token d'Accès Personnel (Recommandé)

1. **Créer un token GitHub :**
   - Allez sur https://github.com/settings/tokens
   - Cliquez sur "Generate new token" > "Generate new token (classic)"
   - Donnez un nom (ex: "steph_world")
   - Sélectionnez les scopes : `repo` (accès complet aux dépôts)
   - Cliquez sur "Generate token"
   - **⚠️ COPIEZ LE TOKEN** (il ne sera affiché qu'une fois)

2. **Pousser avec le token :**
   ```bash
   cd /home/steph/steph_world
   git push https://VOTRE_TOKEN@github.com/Gr3g0552/steph_world.git master
   ```
   Remplacez `VOTRE_TOKEN` par le token que vous avez copié.

3. **Ou configurer le remote avec le token :**
   ```bash
   git remote set-url origin https://VOTRE_TOKEN@github.com/Gr3g0552/steph_world.git
   git push -u origin master
   ```

## Option 2 : Utiliser SSH (Plus sécurisé pour usage répété)

1. **Vérifier si vous avez une clé SSH :**
   ```bash
   ls -la ~/.ssh/id_rsa.pub
   ```

2. **Si vous n'avez pas de clé SSH, en créer une :**
   ```bash
   ssh-keygen -t ed25519 -C "gregory.monsoro@gmail.com"
   # Appuyez sur Entrée pour accepter les valeurs par défaut
   ```

3. **Afficher votre clé publique :**
   ```bash
   cat ~/.ssh/id_rsa.pub
   ```

4. **Ajouter la clé à GitHub :**
   - Allez sur https://github.com/settings/keys
   - Cliquez sur "New SSH key"
   - Collez le contenu de `~/.ssh/id_rsa.pub`
   - Cliquez sur "Add SSH key"

5. **Changer le remote en SSH :**
   ```bash
   cd /home/steph/steph_world
   git remote set-url origin git@github.com:Gr3g0552/steph_world.git
   git push -u origin master
   ```

## Option 3 : Utiliser GitHub CLI

1. **Installer GitHub CLI :**
   ```bash
   # Sur Raspberry Pi (Debian/Ubuntu)
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh
   ```

2. **Se connecter :**
   ```bash
   gh auth login
   ```

3. **Pousser :**
   ```bash
   cd /home/steph/steph_world
   git push -u origin master
   ```

## Vérification

Après avoir poussé, vérifiez sur :
https://github.com/Gr3g0552/steph_world

---

**Note :** Pour les prochains pushs, vous pouvez simplement utiliser :
```bash
git push
```

