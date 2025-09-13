#!/bin/bash

# Script de déploiement pour DigitalOcean Droplet
# Usage: ./deploy.sh [production|development]

set -e  # Arrêter en cas d'erreur

# Configuration
PROJECT_NAME="manga-scraper"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions d'affichage
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction de nettoyage en cas d'erreur
cleanup() {
    log_error "Déploiement interrompu"
    exit 1
}

trap cleanup ERR

# Vérifier l'environnement
ENVIRONMENT=${1:-production}
log_info "Déploiement en mode: $ENVIRONMENT"

# Vérifier que Docker et Docker Compose sont installés
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose n'est pas installé"
    exit 1
fi

# Créer les dossiers nécessaires
log_info "Création des dossiers nécessaires..."
mkdir -p docker/nginx
mkdir -p docker/init-db
mkdir -p logs

# Vérifier le fichier .env
if [ ! -f "$ENV_FILE" ]; then
    log_warning "Fichier .env non trouvé, création depuis .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_warning "⚠️  N'oubliez pas de configurer votre fichier .env avec vos vraies valeurs!"
    else
        log_error "Aucun fichier .env ou .env.example trouvé"
        exit 1
    fi
fi

# Vérification des variables critiques
log_info "Vérification de la configuration..."
source $ENV_FILE

if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "your_password" ]; then
    log_error "Veuillez configurer un mot de passe sécurisé dans DB_PASSWORD"
    exit 1
fi

# Arrêter les conteneurs existants
log_info "Arrêt des conteneurs existants..."
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans || true

# Nettoyer les images inutilisées (optionnel)
if [ "$ENVIRONMENT" = "production" ]; then
    log_info "Nettoyage des images Docker inutilisées..."
    docker system prune -f --volumes || true
fi

# Construire et démarrer les services
log_info "Construction et démarrage des services..."
if [ "$ENVIRONMENT" = "development" ]; then
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
else
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache manga_app
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
fi

# Attendre que les services soient prêts
log_info "Attente du démarrage des services..."
sleep 10

# Vérifier le statut des services
log_info "Vérification du statut des services..."
if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "Up"; then
    log_success "Services démarrés avec succès"
else
    log_error "Problème avec le démarrage des services"
    docker-compose -f $DOCKER_COMPOSE_FILE logs
    exit 1
fi

# Test de santé de l'API
log_info "Test de l'API..."
sleep 5  # Attendre que l'API soit vraiment prête

if curl -f -s "http://localhost:${PORT:-3000}/health" > /dev/null; then
    log_success "API opérationnelle sur le port ${PORT:-3000}"
else
    log_warning "L'API ne répond pas encore, vérifiez les logs avec: docker-compose logs manga_app"
fi

# Afficher les informations de déploiement
log_success "🚀 Déploiement terminé!"
echo ""
log_info "Services disponibles:"
echo "  - API: http://localhost:${PORT:-3000}"
echo "  - Health check: http://localhost:${PORT:-3000}/health"
echo "  - Documentation API: http://localhost:${PORT:-3000}/api/manga"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "  - Nginx (si activé): http://localhost:80"
fi
echo ""
log_info "Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Arrêter: docker-compose down"
echo "  - Redémarrer: docker-compose restart"
echo "  - Voir le statut: docker-compose ps"
echo "  - Mise à jour rapide: update-manga-scraper.sh (si installé)"
echo "  - Backup DB: docker-compose exec postgres pg_dump -U postgres manga_scraper > backup.sql"
echo ""

# Afficher les logs en temps réel (optionnel)
read -p "Voulez-vous voir les logs en temps réel ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Affichage des logs (Ctrl+C pour quitter)..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs -f
fi