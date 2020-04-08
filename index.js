#!/usr/bin/env node

'use strict'

const assert = require('assert')
const ini = require('ini')
const fs = require('fs')
const https = require('https')
const path = require('path')
const qs = require('querystring')
const args = require('minimist')(process.argv.slice(2))

const sshPattern = /^git@github.com:(.+)\.git$/
const httpsPattern = /^https:\/\/github\.com\/(.+)\.git$/

let nwo = args.r

if (!nwo) {
  try {
    const config = ini.parse(
      fs.readFileSync(path.join(process.cwd(), '.git', 'config')).toString()
    )

    const remote = config['remote "origin"'].url
    const match = remote.match(sshPattern) || remote.match(httpsPattern)
    if (match) nwo = match[1]
  } catch (err) {
    // Just ignore this, we'll error out in the assert.
  }
}

assert(nwo, 'Must provide a repo (-r owner/repo) or have one in .git/config')
assert(args._[0], 'Must provide an event as the first positional argument')

const req = https.request(
  `https://api.github.com/repos/${nwo}/dispatches`,
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

const payload = {event_type: args._[0]}

if (args._.length) {
  payload.client_payload = args._.slice(1).reduce(
    (clientPayload, kv) => Object.assign(clientPayload, qs.parse(kv)),
    {}
  )
}

req.write(JSON.stringify(payload))
req.end()
