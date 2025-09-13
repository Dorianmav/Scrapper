// For more information, see https://crawlee.dev/
import { CheerioCrawler, ProxyConfiguration, Configuration } from 'crawlee';
import { testConnection, syncDatabase } from '../database/config.js';
import { initializeModels } from '../database/models/index.js';

// Activer les logs de debug pour le débogage
// Configuration.getGlobalConfig().set('logLevel', 'DEBUG');

// Activer les logs de debug pour les erreurs
Configuration.getGlobalConfig().set('logLevel', 'ERROR');

import { router } from './mangaScraperRoutes.js';

const startUrlsWITH_DEFAULT = ['https://www.nautiljon.com/mangas/gachiakuta.html'];
const startUrlsWITHOUT_DEFAULT = ['https://www.nautiljon.com/mangas/sakamoto+days.html'];

const crawler = new CheerioCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,

    // Comment this option to scrape the full website.
    // maxRequestsPerCrawl: 100,

    // Ajouter un délai entre les requêtes pour ne pas surcharger le site
    requestHandlerTimeoutSecs: 60,

    maxConcurrency: 1, // Limiter le nombre de requêtes simultanées

    // Délai entre les requêtes (en millisecondes)
    maxRequestRetries: 3,

    // Configuration des timeouts
    navigationTimeoutSecs: 30,
});

// Fonction principale avec initialisation de la base de données
async function main() {
    console.log('🚀 Démarrage de l\'application...');
    
    // Initialiser la connexion à la base de données
    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('❌ Impossible de se connecter à la base de données. Arrêt de l\'application.');
        process.exit(1);
    }
    
    // Initialiser les modèles
    await initializeModels();
    
    // Synchroniser la base de données (créer les tables si elles n'existent pas)
    await syncDatabase();
    
    console.log('🕷️ Démarrage du crawler...');
    
    // Lancer le crawler
    await crawler.run(startUrlsWITHOUT_DEFAULT);
    
    console.log('✅ Scraping terminé avec succès!');
}

// Lancer l'application
main().catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
