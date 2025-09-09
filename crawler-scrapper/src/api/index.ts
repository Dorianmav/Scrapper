import { startServer } from './server.js';

// Point d'entrée pour l'API
startServer().catch((error) => {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
});
