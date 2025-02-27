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
                url: `https://www.bobaedream.co.kr/list?code=best&or_gu=10&or_se=desc&pagescale=10&type=list&page=${page}`,
            })

            const $ = cheerio.load(docsResult.data)

            const docs = $('tr .pl14 a.bsubject').map((i, el) => {
                return $(el).attr('href')
            }).get()

            for(let i = 0; i < docs.length; i++) {
                try {
                    const doc = docs[i]

                    const re = /No\=([0-9]+)\&/
                    const reExec = re.exec(doc)
                    const docNo = reExec[1]

                    console.log(`docNo: ${docNo}`)

                    const docResult = await axios({
                        method: 'get',
                        url: 'https://www.bobaedream.co.kr/' + doc,
                    })

                    const $$ = cheerio.load(docResult.data)

                    const comment = $$('li dl dd[id^="small_cmt"]').map((i, el) => {
                        return $$(el).text().replace(/[\n\t\s])+/g, ' ').trim()
                    }).get()

                    comments = [...comments, ...comment]
                } catch(e) {
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

    fs.writeFileSync('bobaedream.json', JSON.stringify(comments))
})()