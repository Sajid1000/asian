import axios from 'axios'
import { JSDOM } from 'jsdom'
import { generateEncryptAjaxParameters, decryptEncryptAjaxResponse } from '../extractors/asianload.js'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'

let PROXY_URL

export async function corsProxy(url) {
    PROXY_URL = `${url}/proxy?url=`
}

const BASE_URL = 'https://draplay.info'

// Cache object to store fetched data
const cache = {}

async function fetchData(url) {
    if (cache[url]) {
        return cache[url]
    }
    const response = await axios.get(url)
    cache[url] = response.data
    return response.data
}




export async function getVideoDrama(epId) {
    const url = `${PROXY_URL}${BASE_URL}/videos/${epId}`
    try {
        const html = await fetchData(url)
        const dom = new JSDOM(html)
        const doc = dom.window.document

        const items = doc.querySelectorAll('ul.listing.items.lists > li.video-block > a')
        const title = doc.querySelector('div.video-info-left > h1').textContent
        const desc = doc.querySelector('#rmjs-1').textContent.trim()
        const iframe = doc.querySelector('div.watch_play > div.play-video > iframe').src
        const episodes = []

        items.forEach(item => {
            episodes.push({
                episodeId: `${item.toString().split('videos/')[1]}`,
                episodeNum: parseFloat(`${item.toString().match(/episode-(.*)/i)?.[1].split('-').join('.')}`),
                url: `${BASE_URL}${item}`,
            })
        })

        return {
            title: title,
            desc: desc,
            videoSrc,
            episodes: episodes.reverse()
        }
    } catch (error) {
        throw error
    }
}

export async function scrapeM3U8(episodeId) {
    let primarySources = []
    let backupSources = []

    try {
        let episodePage, videoServer, $, serverUrl

        if (!episodeId) {
            throw Error('Episode ID not found')
        }

        const episodeUrl = `${PROXY_URL}${BASE_URL}/videos/${episodeId}`
        const episodeHtml = await fetchData(episodeUrl)
        $ = cheerio.load(episodeHtml)

        videoServer = $('div.watch_play > div.play-video > iframe').attr('src')
        serverUrl = new URL(`https:${videoServer}`)

        const goGoServerPage = await axios.get(serverUrl.href, {
            headers: { 'User-Agent': USER_AGENT },
        })
        const $$ = cheerio.load(goGoServerPage.data)

        const ajaxParameters = await generateEncryptAjaxParameters(
            $$,
            serverUrl.searchParams.get('id')
        )

        const fetchResponse = await axios.get(
            `${serverUrl.protocol}//${serverUrl.hostname}/encrypt-ajax.php?${ajaxParameters}`,
            {
                headers: {
                    'User-Agent': USER_AGENT,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            }
        )

        const decryptedResponse = decryptEncryptAjaxResponse(fetchResponse.data)

        if (!decryptedResponse.source) {
            return { error: 'No sources found. Try a different source.' }
        }

        decryptedResponse.source.forEach((source) => primarySources.push(source))
        decryptedResponse.source_bk.forEach((source) => backupSources.push(source))

        return {
            referer: serverUrl.href,
            primarySrc: primarySources,
            backupSrc: backupSources,
        }
    } catch (error) {
        return { error: error.message }
    }
}

