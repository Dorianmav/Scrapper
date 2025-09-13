# Guide de déploiement sur Digital Ocean

## 📋 Prérequis
- Un droplet Digital Ocean (Ubuntu 20.04+ recommandé)
- Docker et Docker Compose installés sur le droplet
- Un nom de domaine (optionnel mais recommandé)

## 🚀 Étapes de déploiement

### 1. Préparer le serveur Digital Ocean

```bash
# Se connecter au droplet
ssh root@your-droplet-ip

# Mettre à jour le système
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Créer un utilisateur non-root (recommandé)
adduser deployer
usermod -aG docker deployer
```

### 2. Transférer le code

```bash
# Option 1: Via Git (recommandé)
git clone https://github.com/votre-username/votre-repo.git
cd votre-repo

# Option 2: Via SCP
scp -r ./crawler-scrapper root@your-droplet-ip:/opt/manga-scraper
```

### 3. Configurer l'environnement

```bash
# Copier et modifier le fichier d'environnement
cp .env.production .env

# Éditer les variables d'environnement
nano .env

# IMPORTANT: Changez au minimum:
# - DB_PASSWORD (utilisez un mot de passe fort)
# - Vérifiez que PORT=3000
```

### 4. Lancer l'application

```bash
# Construire et démarrer les services
docker-compose up -d --build

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f app
```

### 5. Configurer le firewall

```bash
# Autoriser les ports nécessaires
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS (si SSL configuré)
ufw enable
```

### 6. Tester l'application

```bash
# Test local sur le droplet
curl http://localhost:3000/health

# Test depuis l'extérieur
curl http://your-droplet-ip/health
```

## 🔧 Commandes utiles

```bash
# Voir les logs
docker-compose logs -f app
docker-compose logs -f postgres

# Redémarrer l'application
docker-compose restart app

# Mettre à jour l'application
git pull
docker-compose up -d --build

# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U manga_user manga_scraper_prod > backup.sql

# Restaurer la base de données
docker-compose exec -T postgres psql -U manga_user manga_scraper_prod < backup.sql
```

## 🔒 Sécurité (Recommandations)

1. **Changez tous les mots de passe par défaut**
2. **Configurez SSL/HTTPS** avec Let's Encrypt
3. **Limitez l'accès SSH** (clés SSH uniquement)
4. **Configurez des sauvegardes automatiques**
5. **Surveillez les logs** régulièrement

## 📊 Monitoring

```bash
# Surveiller l'utilisation des ressources
docker stats

# Vérifier l'espace disque
df -h

# Surveiller les processus
htop
```

## 🆘 Dépannage

### L'application ne démarre pas
```bash
# Vérifier les logs
docker-compose logs app

# Vérifier la connectivité à la DB
docker-compose exec app ping postgres
```

### Base de données inaccessible
```bash
# Vérifier que PostgreSQL fonctionne
docker-compose logs postgres

# Tester la connexion
docker-compose exec postgres psql -U manga_user -d manga_scraper_prod -c "SELECT 1;"
```

### Problèmes de performance
```bash
# Vérifier les ressources
docker stats
free -h
df -h

# Redimensionner le droplet si nécessaire
```
