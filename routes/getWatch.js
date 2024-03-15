const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const { generateEncryptAjaxParameters, decryptEncryptAjaxResponse } = require('./extractors/asianload.js');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36';

const router = express.Router();

async function fetchData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
}

router.get('/:id', async (req, res) => {
    try {
        const epId = req.params.id;
        const PROXY_URL = `${req.protocol}://${req.get('host')}/proxy?url=`;
        const url = `${PROXY_URL}https://draplay.info/videos/${epId}`;
        const html = await fetchData(url);
        const dom = new JSDOM(html);
        const $ = cheerio.load(dom.window.document.documentElement.innerHTML);

        const items = $('ul.listing.items.lists > li.video-block > a');
        const title = $('div.video-info-left > h1').text();
        const desc = $('#rmjs-1').text().trim();
        const iframe = $('div.watch_play > div.play-video > iframe').attr('src');
        const episodes = [];

        items.each((index, element) => {
            const href = $(element).attr('href');
            const episodeId = href ? href.split('videos/')[1] : null;
            const episodeNum = parseFloat($(element).text().match(/episode-(.*)/i)?.[1].split('-').join('.'));

            episodes.push({
                episodeId: episodeId,
                episodeNum: episodeNum,
                url: `${PROXY_URL}https://draplay.info${href}`,
            });
        });

        const primarySources = [];
        const backupSources = [];

        const ajaxParameters = await generateEncryptAjaxParameters(
            cheerio,
            epId
        );

        const fetchResponse = await axios.get(
            `${url}/encrypt-ajax.php?${ajaxParameters}`,
            {
                headers: {
                    'User-Agent': USER_AGENT,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            }
        );

        const decryptedResponse = decryptEncryptAjaxResponse(fetchResponse.data);

        if (!decryptedResponse.source) {
            return res.status(404).json({ error: 'No sources found. Try a different source.' });
        }

        decryptedResponse.source.forEach((source) => primarySources.push(source));
        decryptedResponse.source_bk.forEach((source) => backupSources.push(source));

        return res.status(200).json({
            title: title,
            description: desc,
            videoSrc: iframe,
            episodes: episodes.reverse(),
            referer: url,
            primarySrc: primarySources,
            backupSrc: backupSources,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;
