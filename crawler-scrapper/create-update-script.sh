#!/bin/bash

# Script autonome pour créer le script de mise à jour rapide
# Usage: sudo ./create-update-script.sh

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📝 Création du script de mise à jour rapide pour Manga Scraper...${NC}"

# Vérifier les permissions
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Ce script doit être exécuté avec sudo${NC}"
    echo "Usage: sudo $0"
    exit 1
fi

# Détecter le répertoire du projet
if [ -f "docker-compose.yml" ]; then
    PROJECT_DIR="$(pwd)"
    echo -e "${GREEN}✅ Projet détecté dans: $PROJECT_DIR${NC}"
elif [ -f "/opt/manga-scraper/docker-compose.yml" ]; then
    PROJECT_DIR="/opt/manga-scraper"
    echo -e "${GREEN}✅ Projet détecté dans: $PROJECT_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  Répertoire du projet non détecté automatiquement${NC}"
    read -p "Entrez le chemin complet du projet (ex: /opt/manga-scraper): " PROJECT_DIR
    
    if [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
        echo -e "${RED}❌ docker-compose.yml non trouvé dans $PROJECT_DIR${NC}"
        exit 1
    fi
fi

# Créer le script de mise à jour rapide
echo -e "${BLUE}🔧 Création du script /usr/local/bin/update-manga-scraper.sh...${NC}"

tee /usr/local/bin/update-manga-scraper.sh >/dev/null <<EOF
#!/bin/bash
set -e

# Configuration automatique
PROJECT_DIR="$PROJECT_DIR"
SERVICE_NAME="manga_app"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\${BLUE}🔄 Mise à jour rapide du Manga Scraper...\${NC}"

# Vérifier si le répertoire existe
if [ ! -d "\$PROJECT_DIR" ]; then
    echo -e "\${RED}❌ Répertoire \$PROJECT_DIR non trouvé\${NC}"
    echo -e "\${BLUE}ℹ️  Vérifiez le chemin du projet\${NC}"
    exit 1
fi

cd "\$PROJECT_DIR"

# Vérifier que Docker Compose fonctionne
if ! docker-compose ps >/dev/null 2>&1; then
    echo -e "\${RED}❌ Docker Compose ne fonctionne pas dans ce répertoire\${NC}"
    echo -e "\${BLUE}ℹ️  Vérifiez que les services sont démarrés avec: docker-compose up -d\${NC}"
    exit 1
fi

# Sauvegarder les logs actuels (optionnel)
echo -e "\${BLUE}📋 Sauvegarde des logs...\${NC}"
mkdir -p logs
docker-compose logs --tail=100 \$SERVICE_NAME > "logs/pre-update-\$(date +%Y%m%d_%H%M%S).log" 2>/dev/null || true

# Stash des modifications locales éventuelles
echo -e "\${BLUE}💾 Sauvegarde des modifications locales...\${NC}"
git stash push -m "Auto-stash before update \$(date)" 2>/dev/null || true

# Récupérer les dernières modifications
echo -e "\${BLUE}📥 Récupération des modifications depuis Git...\${NC}"
git fetch origin
OLD_COMMIT=\$(git rev-parse HEAD)
git pull origin main
NEW_COMMIT=\$(git rev-parse HEAD)

if [ "\$OLD_COMMIT" = "\$NEW_COMMIT" ]; then
    echo -e "\${YELLOW}ℹ️  Aucune nouvelle mise à jour disponible\${NC}"
    echo -e "\${BLUE}✅ L'application est déjà à jour !\${NC}"
    exit 0
fi

echo -e "\${BLUE}📊 Nouvelles modifications:\${NC}"
git log --oneline --graph \$OLD_COMMIT..\$NEW_COMMIT | head -10

# Arrêter temporairement l'application (garde PostgreSQL en marche)
echo -e "\${BLUE}⏹️  Arrêt temporaire de l'application...\${NC}"
docker-compose stop \$SERVICE_NAME

# Rebuild l'image de l'application seulement
echo -e "\${BLUE}🔨 Reconstruction de l'application...\${NC}"
docker-compose build --no-cache \$SERVICE_NAME

# Redémarrer l'application
echo -e "\${BLUE}🚀 Redémarrage de l'application...\${NC}"
docker-compose up -d \$SERVICE_NAME

# Attendre que le service soit prêt
echo -e "\${BLUE}⏳ Attente du démarrage (30s max)...\${NC}"
for i in {1..30}; do
    if curl -f -s "http://localhost:3000/health" > /dev/null 2>&1; then
        break
    fi
    sleep 1
    echo -n "."
done
echo

# Vérifier que l'application fonctionne
if curl -f -s "http://localhost:3000/health" > /dev/null 2>&1; then
    echo -e "\${GREEN}✅ Mise à jour terminée avec succès !\${NC}"
    echo -e "\${BLUE}ℹ️  API disponible sur http://localhost:3000\${NC}"
else
    echo -e "\${RED}⚠️  L'application ne répond pas, vérifiez les logs...\${NC}"
    echo -e "\${BLUE}📋 Derniers logs:\${NC}"
    docker-compose logs --tail=20 \$SERVICE_NAME
    
    echo -e "\${YELLOW}🔄 Tentative de redémarrage...\${NC}"
    docker-compose restart \$SERVICE_NAME
    sleep 10
    
    if curl -f -s "http://localhost:3000/health" > /dev/null 2>&1; then
        echo -e "\${GREEN}✅ Redémarrage réussi !\${NC}"
    else
        echo -e "\${RED}❌ Problème persistant, vérification manuelle nécessaire\${NC}"
        exit 1
    fi
fi

# Afficher les informations de version
echo -e "\${BLUE}📊 Informations de mise à jour:\${NC}"
echo "  - Ancien commit: \$OLD_COMMIT"
echo "  - Nouveau commit: \$NEW_COMMIT"
echo "  - Dernier commit: \$(git log -1 --pretty=format:'%h - %s (%an, %ar)')"
echo
echo -e "\${BLUE}🐳 Statut des conteneurs:\${NC}"
docker-compose ps

# Nettoyage des images inutilisées
echo -e "\${BLUE}🧹 Nettoyage des anciennes images Docker...\${NC}"
docker image prune -f

echo
echo -e "\${GREEN}🎉 Mise à jour rapide terminée avec succès !\${NC}"
echo -e "\${BLUE}💡 Conseils:\${NC}"
echo "  - Logs en temps réel: docker-compose logs -f"
echo "  - Redémarrage manuel: docker-compose restart manga_app"
echo "  - Rollback si problème: git checkout \$OLD_COMMIT && docker-compose build manga_app && docker-compose up -d"
EOF

# Rendre le script exécutable
chmod +x /usr/local/bin/update-manga-scraper.sh

echo -e "${GREEN}✅ Script de mise à jour créé avec succès !${NC}"
echo
echo -e "${BLUE}📋 Utilisation:${NC}"
echo "  update-manga-scraper.sh"
echo
echo -e "${BLUE}💡 Le script effectue:${NC}"
echo "  ✓ Backup automatique des logs"
echo "  ✓ Git pull des dernières modifications"  
echo "  ✓ Rebuild de l'application uniquement"
echo "  ✓ Redémarrage intelligent (garde PostgreSQL actif)"
echo "  ✓ Vérifications de santé"
echo "  ✓ Nettoyage automatique"
echo
echo -e "${YELLOW}⚠️  Note: PostgreSQL reste actif pendant la mise à jour${NC}"
echo -e "${GREEN}🚀 Vous pouvez maintenant utiliser: update-manga-scraper.sh${NC}"