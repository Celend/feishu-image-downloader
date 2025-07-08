# feishu image downloader

Download all images in a feishu chat.

## Prerequisites

- self-build app must have required permissions(check the code)
- the bot must in the target chat

## Usage
```
$ npm install
$ npx tsx index.ts  --help 
Usage: feishu-image-downloader [options] [chatId] [out]

download all images in a chat

Arguments:
  chatId                    env: FID_CHAT_ID, which chat to download
  out                       output dir, default ./out

Options:
  --app-id [appId]          env: FID_APP_ID, feishu self build app id
  --app-secret [appSecret]  env: FID_APP_SECRET, feishu self build app secret
  -h, --help                display help for command
```
