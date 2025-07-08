import {Command} from 'commander'
import {Config, Downloader} from './downloader'

export const cli = new Command('feishu-image-downloader')
cli.description('download all images in a chat')
cli.option('--app-id [appId]',  'env: FID_APP_ID, feishu self build app id')
cli.option('--app-secret [appSecret]', 'env: FID_APP_SECRET, feishu self build app secret')
cli.argument('[chatId]', 'env: FID_CHAT_ID, which chat to download')
cli.argument('[out]', 'output dir, default ./out')

cli.action((chatId, out, options) => {
  const config = new Config({
    ...(options || {}),
    chatId: chatId,
    out: out,
  })
  if (!config.valid) {
    cli.help()
  }
  const dl = new Downloader(config)
  dl.start().catch(e => {
    console.error(e)
    process.exit(1)
  })
})
