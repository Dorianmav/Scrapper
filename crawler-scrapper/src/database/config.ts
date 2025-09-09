import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Debug: afficher les variables d'environnement chargées (seulement en développement)
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Variables d\'environnement chargées:', {
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        NODE_ENV: process.env.NODE_ENV
    });
}

// Configuration de la base de données
export const dbConfig = {
    database: process.env.DB_NAME || 'scrapper_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    dialect: 'postgres' as const,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

// Instance Sequelize
export const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    }
);

// Fonction pour tester la connexion
export async function testConnection(): Promise<boolean> {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à PostgreSQL établie avec succès.');
        return true;
    } catch (error) {
        console.error('❌ Impossible de se connecter à la base de données:', error);
        return false;
    }
}

// Fonction pour synchroniser les modèles
export async function syncDatabase(force = false): Promise<void> {
    try {
        await sequelize.sync({ force, alter: true });
        console.log('✅ Base de données synchronisée avec succès.');
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        throw error;
    }
}
