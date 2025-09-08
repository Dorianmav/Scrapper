import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config.js';

// Interface pour les attributs du modèle Manga
export interface MangaDataAttributes {
    id: number;
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

// Interface pour la création (id optionnel)
interface MangaDataCreationAttributes extends Optional<MangaDataAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Modèle Sequelize pour les données manga
export class MangaData extends Model<MangaDataAttributes, MangaDataCreationAttributes> 
    implements MangaDataAttributes {
    public id!: number;
    public url!: string;
    public titre!: string;
    public titre_original?: string;
    public origine?: string;
    public annee_vf?: string;
    public type?: string;
    public genres?: string[];
    public themes?: string[];
    public auteur?: string;
    public traducteur?: string;
    public editeur_vo?: string;
    public editeur_vf?: string;
    public nb_volumes_vo?: string;
    public nb_volumes_vf?: string;
    public prix?: string;
    public volumes?: object;
    public scraped_at!: Date;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

// Définition du modèle
MangaData.init(
    {
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
    },
    {
        sequelize,
        modelName: 'MangaData',
        tableName: 'manga_data',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['url']
            },
            {
                fields: ['titre']
            },
            {
                fields: ['auteur']
            },
            {
                fields: ['scraped_at']
            }
        ]
    }
);
