import { sequelize } from '../config.js';
import { MangaData } from './MangaData.js';

// Export des modèles
export { sequelize, MangaData };

// Fonction pour initialiser tous les modèles
export async function initializeModels(): Promise<void> {
    // Ici vous pouvez initialiser les associations entre modèles si nécessaire
    // MangaData.associate();
    
    console.log('📊 Modèles initialisés (MangaData)');
}
