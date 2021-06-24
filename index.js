require('dotenv').config()

const api = require('./api')
const cron = require('node-cron')
const model = require('./model')

function roundDown(number, decimals) {
    decimals = decimals || 0;
    return ( Math.floor( number * Math.pow(10, decimals) ) / Math.pow(10, decimals) );
}

const compound = async () => {
    const data = await api.payload('GET', '/public/api/ver1/deals?', {
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
            const bot = await api.payload('GET', `/public/api/ver1/bots/${bot_id}/show?`, { bot_id })
            const baseOrderPrice = parseFloat(bot['base_order_volume']).toFixed(2)
            const safetyOrderPrice = bot['safety_order_volume']
            const baseProfit = roundDown(parseFloat(i['final_profit']), 2)
            const profitSplit = roundDown(parseFloat(i['final_profit'] / 3), 2)

            // pairs
            //const pairs = (bot['pairs'] + '').split(',')
            const pairs = bot['pairs']
            const name = bot['name']

            const safetyOrderStepPercentage = bot['safety_order_step_percentage']
            const safetyOrderMaxSize = bot['max_safety_orders']

            // compound the profits from the deal to the bots base price
            //
            // take 1/3 of the profit and compound to the base
            const newBasePrice = (parseFloat(profitSplit) + parseFloat(baseOrderPrice)).toFixed(2)
            // take 2/3 of the profit and compound to the safe order base
            const newSafetyOrderPrice = (parseFloat(safetyOrderPrice) + parseFloat(profitSplit * 2)) / safetyOrderMaxSize

            // update bot with compounded base price
            // (the following keys are there because they are mandatory... a 3commas thing)
            const updateParam = {
                name,
                pairs,
                base_order_volume: newBasePrice, // this is what we're interested in, compound 1/3 of if to the base
                take_profit: bot['take_profit'],
                safety_order_volume: newSafetyOrderPrice.toFixed(2), // compound the remaining 2/3 to the safety order
                martingale_volume_coefficient: bot['martingale_volume_coefficient'],
                martingale_step_coefficient: bot['martingale_step_coefficient'],
                max_safety_orders: safetyOrderMaxSize,
                active_safety_orders_count: bot['active_safety_orders_count'],
                safety_order_step_percentage: safetyOrderStepPercentage,
                take_profit_type: bot['take_profit_type'],
                strategy_list: bot['strategy_list'],
                bot_id: bot['id']
            }

            if (bot['base_order_volume_type'] !== 'percent') {

                // If you wan to preview the data before its saved and updated on your account, comment out this line
                const update = await api.payload('PATCH', `/public/api/ver1/bots/${bot_id}/update?`, updateParam)

                // and use this one instead
                //const update = { error: true }

                const log = (error) => {
                    // log
                    const prefix = error ? 'here was an error compounding bot ' : 'Compounded '

                    console.log(prefix + name)
                    console.log('Deal - ' + dealId)

                    console.log(updateParam)
                    /*console.log('Base Profit - $' + baseProfit)
                    console.log('Profit Split - $' + profitSplit)
                    console.log('Old Base Price -  $' + baseOrderPrice)
                    console.log('New Base Price -  $' + newBasePrice)

                    console.log('Old Safety Price -  $' + safetyOrderPrice)
                    console.log('New Safety Price -  $' + newSafetyOrderPrice.toFixed(2))
                    console.log('Pairs - ', pairs)*/
                    console.log("=====================\n")
                }

                if (update.error) {
                    log(true)
                } else {
                    log()
                    // save deal to database so that it won't be compounded again
                    const compoundedDeal = new model({ dealId })

                    await compoundedDeal.save()
                }
            }
        }
    })
}

cron.schedule('*/1 * * * *', () => compound(), {})
// compound()
