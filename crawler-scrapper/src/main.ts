// For more information, see https://crawlee.dev/
import { CheerioCrawler, ProxyConfiguration } from 'crawlee';

import { router } from './routes.js';

const startUrls = ['https://www.nautiljon.com/mangas/'];

const crawler = new CheerioCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    // Comment this option to scrape the full website.
    maxRequestsPerCrawl: 100,
    // Ajouter un délai entre les requêtes pour ne pas surcharger le site
    requestHandlerTimeoutSecs: 60,
    maxConcurrency: 1, // Limiter le nombre de requêtes simultanées
});

await crawler.run(startUrls);
