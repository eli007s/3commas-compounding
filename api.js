require('dotenv').config()

const querystring = require('querystring');
const crypto = require('crypto')
const fetch = require('node-fetch')

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

module.exports = {
  payload
}
