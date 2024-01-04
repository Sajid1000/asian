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
      /*  console.log([
        scrapeURL,
        title,
        desc,
        episodeTitle,
        episodeList,
        iframeURL,
      ]); */
