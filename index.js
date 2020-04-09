#!/usr/bin/env node

'use strict'

const ini = require('ini')
const fs = require('fs')
const https = require('https')
const path = require('path')
const qs = require('querystring')
const args = require('minimist')(process.argv.slice(2))

const sshPattern = /^git@github.com:(.+)\.git$/
const httpsPattern = /^https:\/\/github\.com\/(.+)$/

if (args.h || args.help) {
  printHelp()
  process.exit(0)
}

let nwo = args.r || args.repo

if (!nwo) {
  try {
    const config = ini.parse(
      fs.readFileSync(path.join(process.cwd(), '.git', 'config')).toString()
    )

    const remote = config['remote "origin"'].url
    const match = remote.match(sshPattern) || remote.match(httpsPattern)
    if (match) nwo = match[1]
    if (nwo.endsWith('.git')) nwo = nwo.slice(0, nwo.length - 4)
  } catch (err) {
    // Just ignore this, we'll error out in the assert.
  }
}

if (!nwo) {
  console.error('Must provide a repo or have one as "origin" in .git/config')
  printHelp()
  process.exit(1)
}

if (!args._[0]) {
  console.error('Must provide an event as the first positional argument')
  printHelp()
  process.exit(1)
}

const req = https.request(
  `https://api.github.com/repos/${nwo}/dispatches`,
  {
    method: 'POST',
    headers: {
      authorization: `Bearer ${
        args.t || args.token || process.env.GITHUB_TOKEN
      }`,
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

function printHelp() {
  console.log(`Send a repository dispatch event to a GitHub repository.
  
Usage:
  dpx [...flags] [event] [...key=value]

Examples:
  dpx deploy branch=master
  dpx -r jclem/dpx -t $githubtoken deploy branch=master
  
Flags:
  -r, --repo  The repository (e.g. jclem/dpx) to dispatch to
  -t, --token A GitHub personal access token with repo scope
  -h, --help  Display this message`)
}
