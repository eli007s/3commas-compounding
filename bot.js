require('dotenv').config()

const api = require('./api')

const bot = async (bot_id) => {
  const data = await api.payload('GET', `/public/api/ver1/bots/${bot_id}/show?`, { bot_id })
  console.log(data)
}

// Bot::SingleBot
// Bot::SwitchBot
// Bot::MultiBot

// enter the bot id here
bot(123456)

