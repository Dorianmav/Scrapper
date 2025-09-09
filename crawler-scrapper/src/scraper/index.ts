// For more information, see https://crawlee.dev/
import { CheerioCrawler, ProxyConfiguration, Configuration } from 'crawlee';
import { testConnection, syncDatabase } from '../database/config.js';
import { initializeModels } from '../database/models/index.js';

// Désactiver complètement les logs de Crawlee
Configuration.getGlobalConfig().set('logLevel', 'ERROR');

import { router } from './mangaScraperRoutes.js';

const startUrls = ['https://www.nautiljon.com/mangas/gachiakuta.html'];
const startUrls2 = ['https://www.nautiljon.com/mangas/twin+star+exorcists.html'];

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
    await crawler.run(startUrls);
    
    console.log('✅ Scraping terminé avec succès!');
}

// Lancer l'application
main().catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
