const axios = require('axios');
const cheerio = require('cheerio')
const express = require('express')
require('dotenv').config()

const apiKey = process.env.API_KEY
const router = express.Router();

router.get('/:id', async (req, res) => {
    let api_key = req.query.api_key
    if (api_key != apiKey) {
        return res.send({response: 'Invalid API Key!'})
    }
    else {
        try {
            const getDetail = async () => {
                try {
                    let id = req.params.id;
                    const siteUrl = `https://draplay.info/videos/${id}`
                    const { data } = await axios.get(siteUrl)
                    const $ = cheerio.load(data)
                    let dataArr = []
                    
                    const elem = $('div.video-details')
                    let name = $(elem).find('span.date').text().trim()
            
                    let totalEp = $('ul.listing.items.lists').find('li').length
            
                    let embedLink = $('div.play-video').find('iframe').attr('src')

                    const episodeList = $("ul.listing.items.lists > li.video-block")
        .map((i, el) => {
          const $el = $(el);
          const title = $el.find("a > div.name").text();
          const date = $el.find("a > div.meta > span.date").text();
          const URL = $el.find("a").attr("href");
          const cover = $el.find("a > div.img > div.picture > img").attr("src");
          const id = i + 1;
          return {
            id: id,
            cover: cover,
            title: title,
            date: date,
            URL: URL,
          };
        })
        .toArray();
                    
                    const parentPara = $('div.content-more-js')
                    const checkPara = $(parentPara).find('p')
            
                    if (checkPara.length) {
                        let description = ''
                        checkPara.each((index, element) => {
                            description += $(element).text().trim() + '\n'
                        })
                        dataArr.push({
                            name,
                            description,
                            totalEp,
                            embedLink,
                            episodeList
                        })
                    }
                    else {
                        let description = $(parentPara).text().trim()
                        dataArr.push({
                            name,
                            description,
                            totalEp,
                            embedLink,
                            episodeList
                        })
                    }
                    return dataArr
                }
                catch (error) {
                    console.error(error)
                }
            }
            const apiData = await getDetail()
            return res.status(200).json({
                result: apiData,
            })
        } catch (error) {
            return res.status(500).json({
                error: error.toString(),
            })
        }
    }
})

module.exports = router;  
