import { Sequelize, DataTypes, Model } from 'sequelize';
import { testConnection, dbConfig, sequelize } from './database/config.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Interface pour le modèle de test
interface TestMangaDataAttributes {
    id?: number;
    url: string;
    titre: string;
    titre_original?: string;
    origine?: string;
    annee_vf?: string;
    type?: string;
    genres?: string[];
    themes?: string[];
    auteur?: string;
    traducteur?: string;
    editeur_vo?: string;
    editeur_vf?: string;
    nb_volumes_vo?: string;
    nb_volumes_vf?: string;
    prix?: string;
    volumes?: object;
    scraped_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

// Interface pour l'instance du modèle
interface TestMangaDataInstance extends Model<TestMangaDataAttributes, Omit<TestMangaDataAttributes, 'id' | 'created_at' | 'updated_at'>>, TestMangaDataAttributes {}

// Utiliser la connexion principale pour les tests
// Cela évite d'avoir à créer une nouvelle base de données

// Définir un modèle de test basé sur MangaData
const TestMangaData = sequelize.define<TestMangaDataInstance>('TestMangaData', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
    },
    titre: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    titre_original: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    origine: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    annee_vf: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    type: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    genres: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    themes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    auteur: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    traducteur: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    editeur_vo: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    editeur_vf: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    nb_volumes_vo: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    nb_volumes_vf: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    prix: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    volumes: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    scraped_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'manga_data_test',
    timestamps: true,
    underscored: true,
    freezeTableName: true
});
async function testDatabase() {
    console.log('🧪 Test de la connexion PostgreSQL...');
    try {
        // Test de connexion à la base de données principale
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Connexion échouée');
        }
        
        console.log(`🔧 Utilisation de la table de test: manga_data_test`);
        
        // Créer la table de test (force: true pour la recréer si elle existe déjà)
        await TestMangaData.sync({ force: true });
        console.log('✅ Table de test créée');
        
        // Test d'insertion
        console.log('📝 Test d\'insertion de données...');
        const testData = await TestMangaData.create({
            url: 'https://example.com/test',
            titre: 'Test Manga Title',
            titre_original: 'Test Original Title',
            origine: 'Japon',
            annee_vf: '2024',
            type: 'Manga',
            genres: ['Action', 'Aventure'],
            themes: ['Combat', 'Amitié'],
            auteur: 'Test Author',
            traducteur: 'Test Translator',
            editeur_vo: 'Test Publisher VO',
            editeur_vf: 'Test Publisher VF',
            nb_volumes_vo: '10',
            nb_volumes_vf: '8',
            prix: '7.50€',
            volumes: {
                simple: [{ numero: 1, image: 'https://example.com/vol1.jpg' }],
                special: [],
                collector: []
            },
            scraped_at: new Date()
        });
        
        console.log('✅ Données insérées:', testData.toJSON());
        
        // Test de lecture
        console.log('📖 Test de lecture des données...');
        const retrievedData = await TestMangaData.findByPk(testData.id);
        console.log('✅ Données récupérées:', retrievedData?.toJSON());
        
        // Test de mise à jour
        console.log('✏️ Test de mise à jour...');
        await testData.update({ titre: 'Updated Test Manga Title', prix: '8.00€' });
        console.log('✅ Données mises à jour');
        
        // Test de suppression
        console.log('🗑️ Test de suppression...');
        await testData.destroy();
        console.log('✅ Données supprimées');
        
        console.log('🎉 Tous les tests sont passés avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        try {
            // Supprimer la table de test
            console.log('🗑️ Suppression de la table de test...');
            await TestMangaData.drop();
            console.log('✅ Table de test supprimée');
        } catch (dropError) {
            console.error('❌ Erreur lors de la suppression de la table:', dropError);
        }
        
        // Ne pas fermer la connexion principale car elle peut être utilisée ailleurs
        console.log('🔌 Test terminé');
    }
}

// Lancer le test
testDatabase();
