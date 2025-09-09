# 🕷️ Manga Scraper & API

Un projet complet de scraping et gestion de mangas depuis Nautiljon avec une API REST intégrée.

## 🚀 Fonctionnalités

- **Scraper Nautiljon** : Extraction automatique des données de mangas
- **API REST** : Interface complète pour gérer votre collection
- **Base PostgreSQL** : Stockage structuré avec Sequelize ORM
- **TypeScript** : Code typé et maintenable
- **Architecture modulaire** : Séparation claire scraper/API

## 📁 Structure du projet

```
src/
├── api/           # API REST Express
│   ├── routes/    # Routes API
│   ├── services/  # Services métier
│   └── server.ts  # Serveur Express
├── scraper/       # Module de scraping
│   ├── index.ts   # Point d'entrée scraper
│   └── mangaScraperRoutes.ts
├── database/      # Configuration BDD
│   ├── models/    # Modèles Sequelize
│   └── config.ts  # Configuration DB
├── shared/        # Code partagé
│   ├── types.ts   # Types TypeScript
│   └── utils/     # Utilitaires
└── tests/         # Tests
```

## 🛠️ Installation

```bash
# Cloner le projet
git clone <repo-url>
cd crawler-scrapper

# Installer les dépendances
npm install

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL
```

## 🚀 Utilisation

### Démarrer l'API
```bash
npm start
```
L'API sera disponible sur `http://localhost:3000`

### Scraper de test
```bash
npm run start:scraper
```

### Tester la base de données
```bash
npm run test:db
```

## 📚 Documentation

- **[API Documentation](./README_API.md)** - Documentation complète de l'API REST
- **Endpoints** : `/api/manga` pour toutes les opérations CRUD
- **Scraping** : `POST /api/manga/scrape` pour scraper de nouveaux mangas
- **Statistiques** : `GET /api/manga/stats/overview` pour les stats de collection

## 🗃️ Base de données

Le projet utilise PostgreSQL avec Sequelize ORM :
- **Modèle MangaData** : Structure complète des données manga
- **Migrations automatiques** : Création/mise à jour des tables
- **Types PostgreSQL** : Support JSON pour volumes et arrays pour genres/thèmes

## 🔧 Configuration

Variables d'environnement requises dans `.env` :
```env
DB_NAME=manga_scrapper
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5433
NODE_ENV=development
PORT=3000
```

## 🧪 Tests

```bash
# Test de connexion base de données
npm run test:db

# Lancer l'API en mode développement
npm run dev
```

## 📦 Technologies

- **Crawlee** : Framework de scraping
- **Express** : Serveur API REST
- **Sequelize** : ORM PostgreSQL
- **TypeScript** : Langage typé
- **Cheerio** : Parsing HTML
- **PostgreSQL** : Base de données
