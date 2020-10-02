#!/usr/bin/env node

'use strict'

const ini = require('ini')
const fs = require('fs')
const https = require('https')
const path = require('path')
const args = require('minimist')(process.argv.slice(2), {
  boolean: ['d', 'dry-run', 'h', 'help', 'raw', 'v', 'version'],
  string: ['r', 'repo', 't', 'token', 'w', 'workflow', 'f', 'ref']
})
const parseKV = require('./parse-kv')

const sshPattern = /^git@github.com:(.+)\.git$/
const httpsPattern = /^https:\/\/github\.com\/(.+)$/

main()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

async function main() {
  const dryRun = args.d || args['dry-run']

  if (args.v || args.version) {
    console.log(require('./package.json').version)
    process.exit(0)
  }

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

  if (!dryRun && !nwo) {
    console.error('Must provide a repo or have one as "origin" in .git/config')
    printHelp()
    process.exit(1)
  }

  const workflow = args.w || args.workflow
  let ref = args.f || args.ref

  if (workflow && !ref) {
    const {body} = await request('GET', `/repos/${nwo}`)
    ref = body.default_branch

    if (!ref) {
      console.error('Must provide a ref if given a workflow')
      printHelp()
      process.exit(1)
    }
  }

  if (ref && !workflow) {
    console.error('Must provide a workflow if given a ref')
    printHelp()
    process.exit(1)
  }

  let event, kvPairs
  if (workflow) {
    kvPairs = args._
  } else {
    ;[event, ...kvPairs] = args._
  }

  if (!workflow && !event) {
    console.error(
      'Must provide an event as the first positional argument when making a repository dispatch'
    )
    printHelp()
    process.exit(1)
  }

  const payload = event ? {event_type: event} : {ref}

  if (kvPairs.length) {
    payload[event ? 'client_payload' : 'inputs'] = kvPairs.reduce(
      (clientPayload, kv) =>
        Object.assign(clientPayload, parseKV(kv, {raw: args.raw})),
      {}
    )
  }

  const url = event
    ? `/repos/${nwo}/dispatches`
    : `/repos/${nwo}/actions/workflows/${workflow}/dispatches`

  if (dryRun) {
    console.log(url)
    console.log(JSON.stringify(payload, null, 2))
    process.exit(0)
  } else {
    const {res, body} = await request('POST', url, payload)

    if (res.statusCode === 204) {
      process.exit(0)
    } else {
      console.error(`Got unexpected status code ${res.statusCode}`)
      console.error(body)
      process.exit(1)
    }
  }
}

function request(method, url, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.github.com${url}`,
      {
        method,
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: `Bearer ${
            args.t || args.token || process.env.GITHUB_TOKEN
          }`,
          'user-agent': 'npm.im/dpx',
          'content-type': 'application/json'
        }
      },
      res => {
        const data = []
        res.on('data', ch => data.push(ch))
        res.on('end', () => {
          resolve({
            res,
            body:
              res.statusCode === 204
                ? ''
                : JSON.parse(Buffer.concat(data).toString('utf-8'))
          })
        })
      }
    )

    req.on('error', err => {
      reject(err)
    })

    if (payload) req.write(JSON.stringify(payload))

    req.end()
  })
}

function printHelp() {
  console.log(`Send a repository dispatch event to a GitHub repository.

Usage:
  dpx [...flags] [event] [...key=value]

Examples:

  Create a repository dispatch:

    dpx deploy branch=master
    dpx --repo=jclem/dpx --token=$githubtoken deploy branch=master

  Create a workflow dispatch:

    dpx --workflow=test

Flags:
  -r, --repo     The repository (e.g. jclem/dpx) to dispatch to
  -t, --token    A GitHub personal access token with repo scope
  -v, --version  Display the version of dpx
      --raw      Do not parse key=value pair values
  -d, --dry-run  Log the event type and payload, but do not send a request
  -h, --help     Display this message

Flags for workflow dispatch only:
  -w, --workflow A workflow ID to dispatch to
  -f, --ref      The Git ref to run the workflow from (uses the default branch if not provided)`)
}
