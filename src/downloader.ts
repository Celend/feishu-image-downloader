import * as lark from '@larksuiteoapi/node-sdk'
import * as fs from 'node:fs'
import * as path from 'node:path'

export class Config {
  constructor(readonly source: any) {}

  get appId() {
    return this.source.appId || process.env.FID_APP_ID
  }

  get appSecret() {
    return this.source.appSecret || process.env.FID_APP_SECRET
  }

  get chatId() {
    return this.source.chatId || process.env.FID_CHAT_ID
  }

  get out() {
    return this.source.out || process.env.FID_OUT_DIR || 'out'
  }

  get valid() {
    return this.appId && this.appSecret && this.chatId && this.out
  }
}


export class Downloader {
  private client: lark.Client

  constructor(readonly config: Config) {
    if (!config.out) {
      throw new Error('out-dir is required')
    }
    fs.mkdirSync(config.out, {recursive: true})
    this.client = new lark.Client({
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
    })
  }

  async start() {
    const chatInfo = await this.client.im.chat.get({
      path: {chat_id: this.config.chatId},
    })
    if (!chatInfo.data) {
      throw new Error('chat not found')
    }

    let pageCount = 1
    const iter = await this.client.im.message.listWithIterator({
      params: {
        page_size: 50,
        container_id: this.config.chatId,
        container_id_type: 'chat',
        sort_type: 'ByCreateTimeDesc',
      },
    })
    for await (let msgs of iter) {
      console.log(`\n\ngetting message page #${pageCount++}, msg time: ${new Date(Number(msgs.items[0]?.create_time || 0)).toLocaleString()}`)

      const imgMsgs = msgs.items.filter(x => x.body.content.match(/image_key/))
      console.log(`${imgMsgs.length} messages contains image, collect image_keys`)
      const imageKeys = new Map<string, string[]>()
      imgMsgs.forEach(x => {
        const reg = /"image_key":"(.*?)"/ig
        let match: RegExpMatchArray
        do {
          match = reg.exec(x.body.content)
          if (match) {
            if (!imageKeys.has(x.message_id)) {
              imageKeys.set(x.message_id, [])
            }
            imageKeys.get(x.message_id).push(match[1])
          }
        } while (match)
      })

      if (!imageKeys.size) {
        console.log('no image found, continue')
        continue
      }
      console.log(`${imageKeys.size} images found, downloading...`)
      for (const [k, v] of imageKeys.entries()) {
        await Promise.all(v.map(x => {
          return this.downloadImage(k, x)
        }))
      }
    }
  }

  async downloadImage(msgId: string, key: string) {
    const imagePath = path.join(this.config.out, `${key}.jpg`)
    if (fs.existsSync(imagePath)) {
      console.log(`downloaded : ${key}`)
      return
    }
    const resp = await this.client.im.messageResource.get({
      path: {message_id: msgId, file_key: key},
      params: {type: 'image'}
    })
    await resp.writeFile(imagePath)
    const {size} = fs.statSync(imagePath)
    console.log(`downloaded : ${key}, size: ${(size / 1024 / 1024).toFixed(2)}mb`)
  }
}
