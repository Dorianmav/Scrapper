# API Manga Scraper

Une API REST complète pour scraper et gérer une collection de mangas depuis Nautiljon.

## 🚀 Démarrage

### Démarrer l'API
```bash
npm start
```

L'API sera disponible sur `http://localhost:3000`

### Démarrer le scraper de test
```bash
npm run start:scraper
```

### Tester la base de données
```bash
npm run test:db
```

## 📋 Endpoints disponibles

### 🔍 Recherche et filtrage

#### GET /api/manga
Récupère tous les mangas avec possibilité de filtrage et pagination.

**Paramètres de requête :**
- `search` : Recherche dans le titre, titre original ou auteur
- `type` : Filtrer par type (Manga, Manhwa, etc.)
- `genres` : Filtrer par genres (peut être un tableau)
- `themes` : Filtrer par thèmes (peut être un tableau)
- `statut` : Filtrer par statut (En cours, Terminé, etc.)
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 20)

**Exemple :**
```bash
GET /api/manga?search=naruto&type=manga&page=1&limit=10
```

#### GET /api/manga/:id
Récupère un manga spécifique par son ID.

### 🕷️ Scraping

#### POST /api/manga/scrape
Scrape un nouveau manga depuis une URL Nautiljon.

**Corps de la requête :**
```json
{
  "url": "https://www.nautiljon.com/mangas/gachiakuta.html"
}
```

### ✏️ Mise à jour

#### PUT /api/manga/:id
Met à jour toutes les informations d'un manga.

**Corps de la requête :**
```json
{
  "statut": "En cours",
  "possede_volumes": [1, 2, 3, 4, 5]
}
```

#### PATCH /api/manga/:id/volumes
Met à jour uniquement les volumes possédés.

**Corps de la requête :**
```json
{
  "possede_volumes": [1, 2, 3, 4, 5, 6]
}
```

### 🗑️ Suppression

#### DELETE /api/manga/:id
Supprime un manga de la base de données.

#### DELETE /api/manga/url
Supprime un manga par son URL.

**Corps de la requête :**
```json
{
  "url": "https://www.nautiljon.com/mangas/example.html"
}
```

### 📊 Statistiques

#### GET /api/manga/stats/overview
Récupère des statistiques générales sur la collection.

**Réponse :**
```json
{
  "total": 150,
  "byType": [
    { "type": "Manga", "count": 120 },
    { "type": "Manhwa", "count": 30 }
  ],
  "byStatut": [
    { "statut": "En cours", "count": 80 },
    { "statut": "Terminé", "count": 70 }
  ]
}
```

## 🏥 Santé de l'API

#### GET /health
Vérifie que l'API fonctionne correctement.

## 📝 Exemples d'utilisation

### Scraper un manga
```bash
curl -X POST http://localhost:3000/api/manga/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.nautiljon.com/mangas/gachiakuta.html"}'
```

### Rechercher des mangas d'action
```bash
curl "http://localhost:3000/api/manga?genres=Action&limit=5"
```

### Mettre à jour les volumes possédés
```bash
curl -X PATCH http://localhost:3000/api/manga/1/volumes \
  -H "Content-Type: application/json" \
  -d '{"possede_volumes": [1, 2, 3, 4, 5]}'
```

### Filtrer par statut et type
```bash
curl "http://localhost:3000/api/manga?statut=En%20cours&type=Manga"
```

## 🗃️ Structure des données

### Modèle Manga
```json
{
  "id": 1,
  "url": "https://www.nautiljon.com/mangas/example.html",
  "titre": "Titre du manga",
  "titre_original": "Original Title",
  "origine": "Japon",
  "annee_vf": "2024",
  "type": "Manga",
  "genres": ["Action", "Aventure"],
  "themes": ["Combat", "Amitié"],
  "auteur": "Nom de l'auteur",
  "traducteur": "Nom du traducteur",
  "editeur_vo": "Éditeur VO",
  "editeur_vf": "Éditeur VF",
  "nb_volumes_vo": "10",
  "nb_volumes_vf": "8",
  "prix": "7.50€",
  "volumes": {
    "simple": [{"numero": 1, "image": "url"}],
    "special": [],
    "collector": []
  },
  "statut": "En cours",
  "possede_volumes": [1, 2, 3],
  "scraped_at": "2024-01-01T00:00:00.000Z",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## ⚡ Fonctionnalités

- ✅ Scraping automatique depuis Nautiljon
- ✅ Recherche full-text dans titres et auteurs
- ✅ Filtrage avancé par genres, thèmes, types, statut
- ✅ Pagination des résultats
- ✅ Gestion des volumes possédés
- ✅ Statistiques de collection
- ✅ API RESTful complète
- ✅ Gestion des erreurs
- ✅ Validation des données

## 🔧 Configuration

L'API utilise les mêmes variables d'environnement que le scraper :

```env
DB_NAME=manga_scrapper
DB_USER=dorian
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5433
NODE_ENV=development
PORT=3000
```
