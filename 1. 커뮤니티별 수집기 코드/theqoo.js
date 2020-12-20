const fs = require('fs')
const axios = require('axios')
const querystring = require('querystring')
const cheerio = require('cheerio')

;(async () => {
    let comments = []

    for(let page = 1; page <= 3000; page++) {
        try {
            console.log(`!!!---- page: ${page} ----!!!`)

            const docsResult = await axios({
                method: 'get',
                url: `https://theqoo.net/index.php?mid=hot&page=${page}`
            })

            const $ = cheerio.load(docsResult.data)

            const docs = $('tr:not([class~="notice"]) td.title a:not(.replyNum)').map((i, el) => {
                return $(el).attr('href')
            }).get()

            for(let i = 0; i < docs.length; i++) {
                try {
                    const doc = docs[i]

                    const re = /document_srl=([0-9]+)/
                    const reExec = re.exec(doc)
                    const docNo = reExec[1]

                    console.log(`docNo: ${docNo}`)

                    const docResult = await axios({
                        method: 'post',
                        url: 'https://theqoo.net/index.php',
                        headers: {
                            'accept': 'application/json, text/javascript',
                            'accept-encoding': 'gzip, deflate, br',
                            'content-type': 'application/json; charset=UTF-8',
                        },
                        data: querystring.stringify({
                            act: "dispBoardContentCommentListTheqoo",
                            document_srl: docNo,
                            cpage: "1"
                        })
                    })

                    let comment = []

                    const replies = docResult.data.comment_list
                    replies.forEach((reply) => {
                        if(!reply.content.includes('commentWarningMessage')) {
                            const $$ = cheerio.load(reply.content)
                            const text = $$.text()
                            if(text) {
                                comment.push($$.text().replace(/[\n\t\s])+/g, ' ').trim())
                            }
                        }
                    })

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

    fs.writeFileSync('theqoo.json', JSON.stringify(comments))
})()