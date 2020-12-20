const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')

;(async () => {
    let comments = []

    for(let page = 1; page <= 3000; page++) {
        try {
            console.log(`!!!---- page: ${page} ----!!!`)

            const docsResult = await axios({
                method: 'get',
                url: `https://bbs.ruliweb.com/hobby/board/300143?view_best=1&page=${page}`
            })

            const $ = cheerio.load(docsResult.data)

            const docs = $('tr:not([class~="inside"]) td.subject a.deco').map((i, el) => {
                return $(el).attr('href')
            }).get()

            for(let i = 0; i < docs.length; i++) {
                try {
                    const doc = docs[i]

                    const re = /\/([0-9]+)\?/
                    const reExec = re.exec(doc)
                    const docNo = reExec[1]

                    console.log(`docNo: ${docNo}`)

                    const docResult = await axios({
                        method: 'get',
                        url: doc,
                    })

                    const $$ = cheerio.load(docResult.data)

                    const comment = $$('.comment_view.normal td.comment span.text').map((i, el) => {
                        return $$(el).text().replace(/[\n\t\s])+/g, ' ').trim()
                    }).get()

                    comments = [...comments, ...comment]
                } catch(e) {
                    console.log(i)
                    i--;
                }
            }

            console.log(`comments.length: ${comments.length}`)

            if(comments.length > 100000) {
                break;
            }
        } catch(e) {
            page--;
        }
    }

    fs.writeFileSync('ruliweb.json', JSON.stringify(comments))
})()