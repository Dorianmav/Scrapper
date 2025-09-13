import { createCheerioRouter } from 'crawlee';
import { MangaData as MangaDataType, VolumesData, VolumeSimple, VolumeSpecial, VolumeCollector } from '../shared/types.js';
import { MangaData } from '../database/models/MangaData.js';
import { Logger } from '../shared/utils/logger.js';

export const router = createCheerioRouter();

// Fonction pour extraire les volumes de manière typée
const extractVolumes = ($: cheerio.CheerioAPI): VolumesData => {
    const volumes: VolumesData = {
        simple: [],
        special: [],
        collector: []
    };

    // Extraction des volumes simples - gestion de deux cas possibles
    // Logger.debug('🔍 Début de l\'extraction des volumes');
    
    // Cas 1: Volumes dans une section "Édition par défaut" → "Volume simple"
    const editionParDefautVolumes = $('h2:contains("Édition par défaut")').next().find('h3:contains("Volume simple")').next().find('img');

    // Logger.debug(`📊 Cas 1: Trouvé ${editionParDefautVolumes.length} volumes dans la section "Édition par défaut"`);
    
    // Debug: vérifier la structure HTML pour les volumes simples
    const h3VolumeSimple = $('h3:contains("Volume simple")');
    // Logger.debug(`🔍 Éléments h3 "Volume simple" trouvés: ${h3VolumeSimple.length}`);
    if (h3VolumeSimple.length > 0) {
        const nextElement = h3VolumeSimple.next();
        // Logger.debug(`🔍 Élément suivant le h3: ${nextElement.prop('tagName')}, classes: ${nextElement.attr('class')}`);
        const divUnVol = nextElement.find('div.unVol');
        // Logger.debug(`🔍 div.unVol trouvés dans l'élément suivant: ${divUnVol.length}`);
    }
    
    if (editionParDefautVolumes.length > 0) {
        // Structure avec "Édition par défaut"
        editionParDefautVolumes.each((index: number, el: cheerio.Element) => {
            let imgSrc = $(el).attr('src');
            const volNumber = index + 1;

            if (imgSrc) {
                imgSrc = 'https://www.nautiljon.com' + imgSrc.replace('/imagesmin/', '/images/');
            }

            const volume: VolumeSimple = {
                numero: volNumber,
                image: imgSrc
            };

            volumes.simple.push(volume);
        });
    } else {
        // Logger.debug('Pas de volumes dans la section "Édition par défaut"');
        // Cas 2: Volumes directement dans des div.unVol sous h3:contains("Volume simple")
        const volumeSimpleElements = $('h3:contains("Volume simple")').next().find('div.unVol');
        // Logger.debug(`🔍 Recherche dans le cas 2: trouvé ${volumeSimpleElements.length} éléments div.unVol`);
        
        volumeSimpleElements.each((index: number, el: cheerio.Element) => {
            const $vol = $(el);
            const link = $vol.find('a').first();
            const titleAttr = link.attr('title');
            // Logger.debug(`📖 Vol ${index}: titleAttr="${titleAttr}", html="${$vol.html()?.substring(0, 100)}..."`);
            
            // Extraire le numéro du volume depuis title="Vol. X"
            let volNumber = index + 1;
            if (titleAttr) {
                const match = titleAttr.match(/Vol\.\s*(\d+)/);
                if (match) {
                    volNumber = parseInt(match[1], 10);
                }
            }
            
            // Chercher l'image dans le lien
            let imgSrc = link.find('img').attr('src');
            
            if (imgSrc) {
                imgSrc = 'https://www.nautiljon.com' + imgSrc.replace('/imagesmin/', '/images/');
            }

            const volume: VolumeSimple = {
                numero: volNumber,
                image: imgSrc
            };

            volumes.simple.push(volume);
        });
    }

    // Extraction des volumes spéciaux
    $('h3:contains("Spécial")').next().find('img').each((_: number, el: cheerio.Element) => {
        let imgSrc = $(el).attr('src');
        const titre = $(el).attr('alt') || `Volume spécial ${_ + 1}`;

        if (imgSrc) {
            imgSrc = 'https://www.nautiljon.com' + imgSrc.replace('/imagesmin/', '/images/');
        }

        const volume: VolumeSpecial = {
            titre,
            image: imgSrc
        };

        volumes.special.push(volume);
    });

    // Extraction des volumes collector
    $('h3:contains("Collector")').next().find('img').each((_: number, el: cheerio.Element) => {
        let imgSrc = $(el).attr('src');
        const titre = $(el).attr('alt') || `Volume collector ${_ + 1}`;

        if (imgSrc) {
            imgSrc = 'https://www.nautiljon.com' + imgSrc.replace('/imagesmin/', '/images/');
        }

        const volume: VolumeCollector = {
            titre,
            image: imgSrc
        };

        volumes.collector.push(volume);
    });

    // Extraction des coffrets
    $('h3:contains("Coffret")').next().find('img').each((_: number, el: cheerio.Element) => {
        let imgSrc = $(el).attr('src');
        const titre = $(el).attr('alt') || `Coffret ${_ + 1}`;

        if (imgSrc) {
            imgSrc = 'https://www.nautiljon.com' + imgSrc.replace('/imagesmin/', '/images/');
        }

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
        
        Logger.debug(`📖 Titre extrait: "${titre}"`);
        
        if (!titre) {
            Logger.error('Titre vide détecté - vérification de la structure HTML');
        }

        // Extraction des informations depuis les éléments li de la structure HTML
        // Fonction utilitaire pour extraire la valeur après les deux points
        const extractValue = (text: string): string => {
            const parts = text.split(':');
            return parts.length > 1 ? parts.slice(1).join(':').trim() : '';
        };

        let titreOriginal = '';
        let origine = '';
        let anneeVF = '';
        let type = '';
        let auteur = '';
        let traducteur = '';
        let editeurVO = '';
        let editeurVF = '';
        let nbVolumesVO = '';
        let nbVolumesVF = '';
        let prix = '';
        let statut = '';
        const genres: string[] = [];
        const themes: string[] = [];

        // Parcourir tous les éléments li pour extraire les informations
        $('li').each((_: number, el: cheerio.Element) => {
            const text = $(el).text().trim();

            if (text.includes('Titre original :')) {
                titreOriginal = extractValue(text);
            } else if (text.includes('Origine :')) {
                origine = extractValue(text);
            } else if (text.includes('Année VF :')) {
                anneeVF = extractValue(text);
            } else if (text.includes('Type :')) {
                type = extractValue(text);
            } else if (text.includes('Genres :')) {
                const genresText = extractValue(text);
                if (genresText) {
                    genresText.split(' - ').forEach(genre => {
                        if (genre.trim()) {
                            genres.push(genre.trim());
                        }
                    });
                }
            } else if (text.includes('Thèmes :')) {
                const themesText = extractValue(text);
                if (themesText) {
                    themesText.split(' - ').forEach(theme => {
                        if (theme.trim()) {
                            themes.push(theme.trim());
                        }
                    });
                }
            } else if (text.includes('Auteur :')) {
                auteur = extractValue(text);
            } else if (text.includes('Traducteur :')) {
                traducteur = extractValue(text);
            } else if (text.includes('Éditeur VO :')) {
                editeurVO = extractValue(text);
            } else if (text.includes('Éditeur VF :')) {
                editeurVF = extractValue(text);
            } else if (text.includes('Nb volumes VO :')) {
                const nbVolumesVOText = extractValue(text);
                nbVolumesVO = nbVolumesVOText;
                
                // Détecter le statut depuis les parenthèses dans nb_volumes_vo
                if (nbVolumesVOText.includes('(En cours)')) {
                    statut = 'En cours';
                    Logger.debug('Statut détecté: En cours');
                } else if (nbVolumesVOText.includes('(Terminé)')) {
                    statut = 'Terminé';
                    Logger.debug('Statut détecté: Terminé');
                }
            } else if (text.includes('Nb volumes VF :')) {
                nbVolumesVF = extractValue(text);
            } else if (text.includes('Prix :')) {
                prix = extractValue(text);
            }
        });

        // Extraction des volumes avec typage approprié
        const volumes = extractVolumes($);

        // Construction de l'objet de données avec typage pour Crawlee
        const mangaData: MangaDataType = {
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
            nbVolumesVO,
            nbVolumesVF,
            prix,
            volumes,
            statut
        };

        // Debug final avant sauvegarde
        Logger.debug(`Données finales avant sauvegarde:`, {
            titre,
            nbVolumesVO,
            statut,
            url
        });

        // Sauvegarde dans PostgreSQL via Sequelize
        try {
            const savedManga = await MangaData.upsert({
                url,
                titre,
                titre_original: titreOriginal,
                origine,
                annee_vf: anneeVF,
                type,
                genres: genres.length > 0 ? genres : undefined,
                themes: themes.length > 0 ? themes : undefined,
                auteur,
                traducteur,
                editeur_vo: editeurVO,
                editeur_vf: editeurVF,
                nb_volumes_vo: nbVolumesVO,
                nb_volumes_vf: nbVolumesVF,
                prix,
                volumes,
                statut: statut || undefined,
                scraped_at: new Date()
            }, {
                conflictFields: ['url']
            });

            log.info('✅ Données sauvegardées en base PostgreSQL', { 
                titre, 
                statut,
                id: savedManga[0].id,
                isNewRecord: savedManga[1]
            });
        } catch (dbError) {
            log.error(' Erreur lors de la sauvegarde en base:', {
                error: dbError instanceof Error ? dbError.message : 'Erreur inconnue',
                titre,
                url
            });
        }

        // Sauvegarde des données pour Crawlee (fichiers JSON)
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

    }
});
