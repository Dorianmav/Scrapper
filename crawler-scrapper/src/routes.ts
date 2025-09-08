import { createCheerioRouter } from 'crawlee';
import { MangaData, VolumesData, VolumeSimple, VolumeSpecial, VolumeCollector } from './types.js';

export const router = createCheerioRouter();

// Fonction utilitaire pour extraire du texte de manière sécurisée
const getTextFromSelector = ($: any, selector: string): string => {
    return $(selector).text().trim() || '';
};

// Fonction pour extraire les volumes de manière typée
const extractVolumes = ($: any): VolumesData => {
    const volumes: VolumesData = {
        simple: [],
        special: [],
        collector: []
    };

    // Extraction des volumes simples - basé sur la structure réelle de Nautiljon
    $('h3:contains("Volume simple")').next().find('img').each((index: number, el: any) => {
        const imgSrc = $(el).attr('src');
        const volNumber = index + 1;
        
        const volume: VolumeSimple = {
            numero: volNumber,
            image: imgSrc
        };
        
        volumes.simple.push(volume);
    });

    // Extraction des volumes spéciaux
    $('h3:contains("Spécial")').next().find('img').each((_: number, el: any) => {
        const imgSrc = $(el).attr('src');
        const titre = $(el).attr('alt') || `Volume spécial ${_ + 1}`;
        
        const volume: VolumeSpecial = {
            titre,
            image: imgSrc
        };
        
        volumes.special.push(volume);
    });

    // Extraction des volumes collector
    $('h3:contains("Collector")').next().find('img').each((_: number, el: any) => {
        const imgSrc = $(el).attr('src');
        const titre = $(el).attr('alt') || `Volume collector ${_ + 1}`;
        
        const volume: VolumeCollector = {
            titre,
            image: imgSrc
        };
        
        volumes.collector.push(volume);
    });

    // Extraction des coffrets
    $('h3:contains("Coffret")').next().find('img').each((_: number, el: any) => {
        const imgSrc = $(el).attr('src');
        const titre = $(el).attr('alt') || `Coffret ${_ + 1}`;
        
        const volume: VolumeCollector = {
            titre,
            image: imgSrc
        };
        
        volumes.collector.push(volume);
    });

    return volumes;
};

router.addDefaultHandler(async ({ request, $, log, pushData }) => {
    const url = request.loadedUrl;
    log.info(`Scraping de la page manga: ${url}`);
    
    try {
        // Extraction des informations de base avec gestion d'erreur
        // Le titre est dans h1 mais il faut enlever le lien "Modifier"
        const titreComplet = $('h1').text().trim();
        const titre = titreComplet.replace('Modifier', '').trim();
        
        // Extraction des informations depuis les éléments de la page
        const titreOriginal = $('td:contains("Titre original")').next('td').text().trim() || '';
        const origine = $('td:contains("Origine")').next('td').text().trim() || '';
        const anneeVF = $('td:contains("Année VF")').next('td').text().trim() || '';
        const type = $('td:contains("Type")').next('td').text().trim() || '';
        
        // Extraction des genres et thèmes avec correction
        const genres: string[] = [];
        $('td:contains("Genres")').next('td').find('a').each((_: number, el: any) => {
            const text = $(el).text().trim();
            if (text) {
                genres.push(text);
            }
        });
            
        const themes: string[] = [];
        $('td:contains("Thèmes")').next('td').find('a').each((_: number, el: any) => {
            const text = $(el).text().trim();
            if (text) {
                themes.push(text);
            }
        });
        
        // Extraction des informations sur l'auteur et le traducteur
        const auteur = $('td:contains("Auteur")').next('td').text().trim() || '';
        const traducteur = $('td:contains("Traducteur")').next('td').text().trim() || '';
        
        // Extraction des informations sur les éditeurs
        const editeurVO = $('td:contains("Éditeur VO")').next('td').text().trim() || '';
        const editeurVF = $('td:contains("Éditeur VF")').next('td').text().trim() || '';
        
        // Extraction des volumes avec typage approprié
        const volumes = extractVolumes($);
        
        // Construction de l'objet de données avec typage
        const mangaData: MangaData = {
            url,
            titre,
            titreOriginal,
            origine,
            anneeVF,
            type,
            genres,
            themes,
            auteur,
            traducteur,
            editeurVO,
            editeurVF,
            volumes
        };
        
        // Sauvegarde des données
        await pushData(mangaData);
        
        log.info('Données extraites avec succès', { titre, volumesCount: volumes.simple.length });
    } catch (error) {
        // Gestion d'erreur avec type assertion sécurisée
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        log.error(`Erreur lors de l'extraction des données`, { 
            error: errorMessage,
            stack: errorStack,
            url: request.loadedUrl 
        });
        
        // Optionnel : relancer l'erreur si vous voulez que Crawlee la gère
        // throw error;
    }
});