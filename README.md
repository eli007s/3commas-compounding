# 3Commas Compounding

This is a helper utility to take the profits from your completed deals and compound them to the bots base order size.

To get started copy `.env.example` to `.env` and fill in the fields.

This uses `mongoosedb` to store and save the deal ID into a database to keep track of deals already compounded. 

## Install
`npm install` or `yarn install`

## Run
`node index.js`

this will run once every minute.
