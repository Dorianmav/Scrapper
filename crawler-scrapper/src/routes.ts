import { createCheerioRouter } from 'crawlee';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`Recherche de liens vers des pages de mangas`);
    await enqueueLinks({
        globs: ['https://www.nautiljon.com/mangas/*'],
        label: 'manga',
    });
});

router.addHandler('manga', async ({ request, $, log, pushData }) => {
    const title = $('title').text();
    log.info(`${title}`, { url: request.loadedUrl });

    await pushData({
        url: request.loadedUrl,
        title,
    });
});
