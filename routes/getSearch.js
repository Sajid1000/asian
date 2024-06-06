const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
require('dotenv').config();

const apiKey = process.env.API_KEY;
const router = express.Router();

router.get('/:id', async (req, res) => {
    const api_key = req.query.api_key;

    // Check if the provided API key matches the stored API key
    if (api_key !== apiKey) {
        return res.status(403).json({ response: 'Invalid API Key!' });
    }

    try {
        // Define the scraping function
        const getDetail = async () => {
            try {
                const id = req.params.id;
                const siteUrl = `https://draplay.info/search.html?keyword=${id}`;
                const { data } = await axios.get(siteUrl);
                const $ = cheerio.load(data);
                let dataArr = [];

                // Scrape poster, name, link, and date
                const poster = $('div.video-image').find('img').attr('src');
                const name = $('div.video-title').text().trim();
                const link = $('div.video-title').find('a').attr('href');
                const date = $('div.video-date').text().trim();

                // Aggregate data
                dataArr.push({
                    poster,
                    name,
                    link,
                    date
                });

                return dataArr;
            } catch (error) {
                console.error(error);
                throw new Error('Error while scraping data');
            }
        };

        // Fetch and respond with the data
        const apiData = await getDetail();
        return res.status(200).json({ result: apiData });
    } catch (error) {
        // Handle any errors that occur during the API call
        return res.status(500).json({ error: error.toString() });
    }
});

module.exports = router;
