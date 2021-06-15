# 3Commas Compounding

This is a helper utility to take the profits from your completed deals and compound them to the bots base order size.

To get started copy `.env.example` to `.env` and fill in the fields.

This uses `mongoosedb` to store and save the deal ID into a database to keep track of deals already compounded. 

## Dependencies
- [node](https://nodejs.org)
- [yarn](https://yarnpkg.com/) (if your not using npm which is installed by default when you install nodejs)

## 3Commas API
![create an API key in 3Commas](https://github.com/eli007s/3commas-compounding/blob/main/img/step1.png?raw=true)
![create an API key in 3Commas](https://github.com/eli007s/3commas-compounding/blob/main/img/step2.png?raw=true)
![create an API key in 3Commas](https://github.com/eli007s/3commas-compounding/blob/main/img/step3.png?raw=true)

## Install
`npm install` or `yarn install`

## Run
`node index.js`

this will run once every minute. In the console you'll get results like these:

![API output](https://github.com/eli007s/3commas-compounding/blob/main/img/results.png?raw=true)

## Roadmap
- [ ] reformat to make code modular
- [ ] add ability to compound grid bots
- [ ] send you a text message everytime compounding occurs with Twilio
- [ ] option to use Telegram to get messages when something happens
- [ ] and/or Slack messages
