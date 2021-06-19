require('dotenv').config()
const cron = require('node-cron')
const querystring = require('querystring');
const crypto = require('crypto')
const fetch = require('node-fetch')
const model = require('./model')
const apiCredentials = {
    url: 'https://api.3commas.io',
    key: process.env.API_KEY,
    secret: process.env.API_SECRET
}

const signature = (requestUri, reqData) => {
    const request = requestUri + reqData
    return crypto.createHmac('sha256', apiCredentials.secret).update(request).digest('hex')
}

const payload = async (method, path, params) => {
    try {
        let response = await fetch(
            `${apiCredentials.url}${path}${querystring.stringify(params)}`,
            {
                method: method,
                timeout: 60000,
                agent: '',
                headers: {
                    'APIKEY': apiCredentials.key,
                    'Signature': signature(path, querystring.stringify(params))
                }
            }
        )

        return await response.json()
    } catch (e) {
        console.log(e);
        return false
    }
}

function roundDown(number, decimals) {
    decimals = decimals || 0;
    return ( Math.floor( number * Math.pow(10, decimals) ) / Math.pow(10, decimals) );
}

const compound = async () => {
    const data = await payload('GET', '/public/api/ver1/deals?', {
        scope: 'completed'
    })

    data.map(async (i) => {
        // check if deal has already been compounded
        const dealId = i.id
        const deal = await model.find({ dealId })

        // if deal hasn't been registered yet, we're good to start our compounding magic
        if (deal.length === 0) {
            // get the bot attached to the deal
            const bot_id = i['bot_id']
            const bot = await payload('GET', `/public/api/ver1/bots/${bot_id}/show?`, { bot_id })
            const baseOrderPrice = parseFloat(bot['base_order_volume']).toFixed(2)
            const safetyOrderPrice = bot['safety_order_volume']
            const baseProfit = roundDown(parseFloat(i['final_profit']), 2)
            const profitSplit = roundDown(parseFloat(i['final_profit'] / 3), 2)

            // compound the profits from the deal to the bots base price
            //
            // take 1/3 of the profit and compound to the base
            const newBasePrice = (parseFloat(profitSplit) + parseFloat(baseOrderPrice)).toFixed(2)
            // take 2/3 of the profit and compound to the safe order base
            const newSafetyOrderPrice = parseFloat(safetyOrderPrice) + parseFloat((profitSplit * 2))

            // update bot with compounded base price
            // (the following keys are there because they are mandatory... dunno why)
            const update = await payload('PATCH', `/public/api/ver1/bots/${bot_id}/update?`, {
                name: bot.name,
                pairs: bot.pairs,
                base_order_volume: newBasePrice, // this is what we're interested in, compound 1/3 of if to the base
                take_profit: bot.take_profit,
                safety_order_volume: newSafetyOrderPrice, // compound the remaining 2/3'ds to the safety order
                martingale_volume_coefficient: bot.martingale_volume_coefficient,
                martingale_step_coefficient: bot.martingale_step_coefficient,
                max_safety_orders: bot.max_safety_orders,
                active_safety_orders_count: bot.active_safety_orders_count,
                safety_order_step_percentage: bot.safety_order_step_percentage,
                take_profit_type: bot.take_profit_type,
                strategy_list: bot.strategy_list,
                bot_id: bot.id
            })

            if (update.error) {
                console.log('There was an error compounding bot ' + bot['name'])
                console.log('Base Profit - $' + baseProfit)
                console.log('Profit Split - $' + profitSplit)
                console.log('Old Base Price -  $' + baseOrderPrice)
                console.log('New Base Price -  $' + newBasePrice)

                console.log('Old Safety Price -  $' + safetyOrderPrice)
                console.log('New Safety Price -  $' + newSafetyOrderPrice)
            } else {
                // log
                console.log('Compounded ' + bot.name)
                console.log('Deal - ' + dealId)

                console.log('Base Profit - $' + baseProfit)
                console.log('Profit Split - $' + profitSplit)
                console.log('Old Base Price -  $' + baseOrderPrice)
                console.log('New Base Price -  $' + newBasePrice)

                console.log('Old Safety Price -  $' + safetyOrderPrice)
                console.log('New Safety Price -  $' + newSafetyOrderPrice)

                // save deal to database so that it won't be compounded again
                const compoundedDeal = new model({ dealId })

                await compoundedDeal.save()
            }
        }
    })
}

cron.schedule('*/1 * * * *', compound(), {})
// compound()
