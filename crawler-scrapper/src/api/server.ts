import express from 'express';
import cors from 'cors';
import { testConnection, syncDatabase } from '../database/config.js';
import { initializeModels } from '../database/models/index.js';
import { mangaRoutes } from './routes/mangaRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/manga', mangaRoutes);

// Route de santé
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', message: 'API Manga Scraper is running' });
});

// Initialisation du serveur
async function startServer() {
    try {
        console.log('🚀 Démarrage du serveur API...');
        
        // Test de connexion à la base de données
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Impossible de se connecter à la base de données');
        }
        
        // Initialiser les modèles
        await initializeModels();
        
        // Synchroniser la base de données (force: true pour ajouter les nouvelles colonnes)
        await syncDatabase(false);
        
        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log(`🌐 Serveur API démarré sur http://localhost:${PORT}`);
            console.log(`📋 Documentation API disponible sur http://localhost:${PORT}/api/manga`);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

// Gestion des erreurs globales
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('❌ Erreur serveur:', err);
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: err.message
    });
});

// Démarrer le serveur si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export { app, startServer };
