'use strict'

const assert = require('assert')
const https = require('https')
const qs = require('querystring')
const args = require('minimist')(process.argv.slice(2))

assert(args.r, 'Must provide a repo (-r owner/repo)')
assert(args.e, 'Must provide an event (-e deplay)')

const req = https.request(
  `https://api.github.com/repos/${args.r}/dispatches`,
  {
    method: 'POST',
    headers: {
      authorization: `Bearer ${args.t || process.env.GITHUB_TOKEN}`,
      'user-agent': 'npm.im/dpx',
      'content-type': 'application/json',
    },
  },
  (res) => {
    if (res.statusCode === 204) {
      process.exit(0)
    } else {
      console.error(`Got unexpected status code ${res.statusCode}`)
      process.exit(1)
    }
  }
)

req.on('error', (err) => {
  console.error(err)
  process.exit(1)
})

const payload = {event_type: args.e}

if (args._.length) {
  payload.client_payload = args._.reduce(
    (clientPayload, kv) => Object.assign(clientPayload, qs.parse(kv)),
    {}
  )
}

req.write(JSON.stringify(payload))
req.end()
