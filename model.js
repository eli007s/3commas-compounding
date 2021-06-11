require('dotenv').config()

const mongoose = require('mongoose')

mongoose.connect(
    `${process.env.DB_URL}/${process.env.DB_TABLE}`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err))

const compoundSchema = new mongoose.Schema({
    dealId: String
})

mongoose.set('useFindAndModify', false)

module.exports = mongoose.model(process.env.DB_COLLECTION, compoundSchema)
