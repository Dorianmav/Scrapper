import { CheerioCrawler, Configuration } from 'crawlee';
import { MangaData } from '../../database/models/MangaData.js';
import { router } from '../../scraper/mangaScraperRoutes.js';
import { Logger } from '../../shared/utils/logger.js';

// Désactiver complètement les logs de Crawlee
Configuration.getGlobalConfig().set('logLevel', 'ERROR');

class ScrapeService {
    private crawler: CheerioCrawler;

    constructor() {
        this.crawler = new CheerioCrawler({
            requestHandler: router,
            maxRequestsPerCrawl: 1,
            requestHandlerTimeoutSecs: 60,
            maxConcurrency: 1,
            maxRequestRetries: 3,
            navigationTimeoutSecs: 30,
            // Désactiver complètement les logs de Crawlee
            useSessionPool: false,
            persistCookiesPerSession: false,
        });
    }

    async scrapeManga(url: string): Promise<any> {
        try {
            Logger.info(`🕷️ Scraping manga: ${url}`);
            Logger.production(`Scraping manga from URL`);
            
            // Vérifier si l'URL est valide
            if (!this.isValidNautiljonUrl(url)) {
                throw new Error('URL non valide. Seules les URLs Nautiljon sont supportées.');
            }
            
            // Vérifier si le manga existe déjà
            const existingManga = await MangaData.findOne({ where: { url } });
            if (existingManga) {
                Logger.info('📚 Manga déjà en base, mise à jour...');
                return await this.updateExistingManga(existingManga, url);
            }
            
            // Lancer le crawler
            await this.crawler.run([url]);
            
            // Récupérer le manga fraîchement scrapé
            const scrapedManga = await MangaData.findOne({ 
                where: { url },
                order: [['created_at', 'DESC']]
            });
            
            if (!scrapedManga) {
                throw new Error('Échec du scraping - aucune donnée récupérée');
            }
            
            // Conversion explicite pour s'assurer que les données sont accessibles
            const mangaData = scrapedManga.toJSON();
            
            Logger.success(`Manga scrapé avec succès: ${mangaData.titre || 'Titre non disponible'}`);
            Logger.debug(`Données complètes:`, {
                id: mangaData.id,
                titre: mangaData.titre,
                statut: mangaData.statut,
                nb_volumes_vo: mangaData.nb_volumes_vo,
                url: mangaData.url
            });
            Logger.production(`Manga scraped successfully`);
            return mangaData;
            
        } catch (error) {
            Logger.error('Erreur lors du scraping:', error);
            throw error;
        }
    }

    async updateExistingManga(manga: any, url: string): Promise<any> {
        try {
            // Re-scraper pour mettre à jour les données
            await this.crawler.run([url]);
            
            // Récupérer les données mises à jour
            await manga.reload();
            
            console.log(`🔄 Manga mis à jour: ${manga.titre}`);
            return manga;
            
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour:', error);
            throw error;
        }
    }

    private isValidNautiljonUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'www.nautiljon.com' && 
                   urlObj.pathname.includes('/mangas/');
        } catch {
            return false;
        }
    }

    async scrapeMultipleMangas(urls: string[]): Promise<any[]> {
        const results = [];
        
        for (const url of urls) {
            try {
                const manga = await this.scrapeManga(url);
                results.push({ success: true, url, manga });
            } catch (error) {
                results.push({ 
                    success: false, 
                    url, 
                    error: error instanceof Error ? error.message : 'Erreur inconnue' 
                });
            }
        }
        
        return results;
    }
}

export const scrapeService = new ScrapeService();
