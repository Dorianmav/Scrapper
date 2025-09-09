import express from 'express';
import { Op } from 'sequelize';
import { MangaData } from '../../database/models/MangaData.js';
import { scrapeService } from '../services/scrapeService.js';

const router = express.Router();

// GET /api/manga - Récupérer tous les mangas avec filtres
router.get('/', async (req, res) => {
    try {
        const { 
            search, 
            type, 
            genres, 
            themes, 
            statut, 
            page = 1, 
            limit = 20 
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        
        // Construction des filtres
        const whereClause: any = {};
        
        if (search) {
            whereClause[Op.or] = [
                { titre: { [Op.iLike]: `%${search}%` } },
                { titre_original: { [Op.iLike]: `%${search}%` } },
                { auteur: { [Op.iLike]: `%${search}%` } }
            ];
        }
        
        if (type) {
            whereClause.type = { [Op.iLike]: `%${type}%` };
        }
        
        if (genres) {
            const genreArray = Array.isArray(genres) ? genres : [genres];
            whereClause.genres = { [Op.overlap]: genreArray };
        }
        
        if (themes) {
            const themeArray = Array.isArray(themes) ? themes : [themes];
            whereClause.themes = { [Op.overlap]: themeArray };
        }
        
        if (statut) {
            whereClause.statut = statut;
        }

        const { rows: mangas, count } = await MangaData.findAndCountAll({
            where: whereClause,
            limit: Number(limit),
            offset,
            order: [['created_at', 'DESC']]
        });

        return res.json({
            mangas,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count,
                totalPages: Math.ceil(count / Number(limit))
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des mangas:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des mangas' });
    }
});

// GET /api/manga/stats/overview - DÉPLACÉ AVANT /:id pour éviter les conflits
router.get('/stats/overview', async (_req, res) => {
    try {
        const totalMangas = await MangaData.count();
        const mangasByType = await MangaData.findAll({
            attributes: ['type', [MangaData.sequelize!.fn('COUNT', '*'), 'count']],
            group: ['type'],
            raw: true
        });
        
        const mangasByStatut = await MangaData.findAll({
            attributes: ['statut', [MangaData.sequelize!.fn('COUNT', '*'), 'count']],
            group: ['statut'],
            raw: true
        });
        
        return res.json({
            total: totalMangas,
            byType: mangasByType,
            byStatut: mangasByStatut
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

// DELETE /api/manga/delete-by-url - DÉPLACÉ AVANT /:id pour éviter les conflits
router.delete('/delete-by-url', async (req, res) => {
    try {
        // Accepter l'URL depuis le body OU les query parameters
        const url = req.body.url || req.query.url;
        
        if (!url) {
            return res.status(400).json({ 
                error: 'URL requise', 
                help: 'Envoyez l\'URL dans le body: {"url": "..."} ou en query parameter: ?url=...' 
            });
        }
        
        console.log(`Tentative de suppression du manga avec URL: ${url}`);
        
        const deleted = await MangaData.destroy({ where: { url } });
        
        if (deleted === 0) {
            return res.status(404).json({ error: 'Aucun manga trouvé avec cette URL' });
        }
        
        return res.json({ 
            message: `${deleted} manga(s) supprimé(s) avec succès`,
            url: url
        });
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la suppression du manga',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
});

// GET /api/manga/:id - Récupérer un manga par ID
router.get('/:id', async (req, res) => {
    try {
        const manga = await MangaData.findByPk(req.params.id);
        
        if (!manga) {
            return res.status(404).json({ error: 'Manga non trouvé' });
        }
        
        
        return res.json(manga);
    } catch (error) {
        console.error('Erreur lors de la récupération du manga:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération du manga' });
    }
});

// POST /api/manga/scrape - Scraper un nouveau manga
router.post('/scrape', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL requise' });
        }
        
        // Vérifier si le manga existe déjà
        const existingManga = await MangaData.findOne({ where: { url } });
        if (existingManga) {
            return res.status(409).json({ 
                error: 'Ce manga a déjà été scrapé',
                manga: existingManga
            });
        }
        
        // Scraper le manga
        const scrapedData = await scrapeService.scrapeManga(url);
        
        if (!scrapedData) {
            return res.status(400).json({ error: 'Impossible de scraper cette URL' });
        }
        
        return res.status(201).json({
            message: 'Manga scrapé avec succès',
            manga: scrapedData
        });
        
    } catch (error) {
        console.error('Erreur lors du scraping:', error);
        return res.status(500).json({ error: 'Erreur lors du scraping du manga' });
    }
});

// PUT /api/manga/:id - Mettre à jour un manga
router.put('/:id', async (req, res) => {
    try {
        const manga = await MangaData.findByPk(req.params.id);
        
        if (!manga) {
            return res.status(404).json({ error: 'Manga non trouvé' });
        }
        
        const updatedManga = await manga.update(req.body);
        
        return res.json({
            message: 'Manga mis à jour avec succès',
            manga: updatedManga
        });
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du manga' });
    }
});

// PATCH /api/manga/:id/volumes - Ajouter des volumes possédés (VERSION CORRIGÉE)
router.patch('/:id/volumes', async (req, res) => {
    try {
        const { possede_volumes, action = 'add' } = req.body;
        
        if (!Array.isArray(possede_volumes)) {
            return res.status(400).json({ error: 'possede_volumes doit être un tableau de numéros' });
        }
        
        const manga = await MangaData.findByPk(req.params.id);
        
        if (!manga) {
            return res.status(404).json({ error: 'Manga non trouvé' });
        }
        
        // Utiliser getDataValue pour accéder aux données Sequelize
        const currentVolumesFromDB = manga.getDataValue('possede_volumes') || [];
        
        // Normaliser les volumes (s'assurer qu'ils sont des nombres)
        const currentVolumes = currentVolumesFromDB.map(vol => Number(vol));
        const volumesToProcess = possede_volumes.map(vol => Number(vol));
        
        let newVolumes: number[] = [];
        
        
        switch (action) {
            case 'replace':
                // Remplacer complètement la liste
                newVolumes = [...volumesToProcess];
                break;
                
            case 'remove':
                // Supprimer des volumes
                newVolumes = currentVolumes.filter(vol => !volumesToProcess.includes(vol));
                break;
                
            case 'add':
            default:
                // Ajouter des volumes (par défaut)
                newVolumes = [...currentVolumes];
                volumesToProcess.forEach(vol => {
                    if (!newVolumes.includes(vol)) {
                        newVolumes.push(vol);
                    }
                });
                break;
        }
        
        // Trier les volumes et les garder comme nombres
        newVolumes.sort((a, b) => a - b);
        
        // Recharger l'instance pour avoir les vraies valeurs de la DB
        await manga.reload();
        
        return res.json({
            message: `Volumes ${action === 'remove' ? 'supprimés' : action === 'replace' ? 'remplacés' : 'ajoutés'} avec succès`,
            manga: manga, // Utiliser l'instance rechargée
            volumes_count: newVolumes.length,
            debug: {
                action,
                volumes_avant: currentVolumes,
                volumes_apres: manga.getDataValue('possede_volumes') || [], // Valeurs réelles de la DB
                volumes_traités: volumesToProcess
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des volumes:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la mise à jour des volumes',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
});

// DELETE /api/manga/:id - Supprimer un manga
router.delete('/:id', async (req, res) => {
    try {
        const manga = await MangaData.findByPk(req.params.id);
        
        if (!manga) {
            return res.status(404).json({ error: 'Manga non trouvé' });
        }
        
        await manga.destroy();
        
        return res.json({ message: 'Manga supprimé avec succès' });
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return res.status(500).json({ error: 'Erreur lors de la suppression du manga' });
    }
});

export { router as mangaRoutes };
