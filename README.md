# dpx <img src="send.svg" align="bottom" height="24px" />

This is a utility for sending [repository dispatch][dispatch] events to
GitHub repositories.

## Use

This tool attempts to allow you to dispatch events quickly with as little typing as possible, provided you've got your environment set up for it:

- You can avoid passing a GitHub token manually by setting a `GITHUB_TOKEN`
  environment variable.
- You can avoid passing a GitHub repository by having a git remote called
  "origin" in your .git/config that points to a GitHub repository
- By default, dpx attempts to parse values as JSON (pass `--raw` to avoid this)

```shell
# Send a "test" event.
> npx dpx test

# Send a "deploy" event with a payload `{"branch": "master"}`.
> npx dpx deploy branch=master

# Send a "db-migrate" event with a payload `{"direction": "up", "count": 1}`
> npx dpx db-migrate direction=up count=1

# Send a "db-migrate" event with a payload `{"direction": "up", "count": "1"}`
> npx dpx --raw db-migrate direction=up count=1
```

### Flags & Arguments

- `-r`/`--repo` A name-with-owner string (as in `jclem/dpx`) pointing to the
  repository for the dispatch to be sent to
- `-t`/`--token` A GitHub personal access token with `repo` scope
- `-v`/`--version` Display the version of dpx
- `--raw` Do not parse values in key=value parirs
- `-d`/`--dry-run` Log event type and payload, but don't send a request
- `-h`/`--help` Display the help message
- `$event` The first non-flag argument is interpreted as the event
- `$key=$value` Any number of key-value pairs that are parsed and sent as a
  JSON object as the event payload

## Context

In the GitHub ecosystem, a repository dispatch event is an event sent to a
particular GitHub repository by a user, app, or tool with an arbitrary type
and JSON payload.

Since GitHub Actions allows workflows to be kicked off by these events, this
flexibility makes repository dispatches a powerful tool for automating many
day-to-day async tasks, such as app deployments, building and packaging, and
many other use cases.

[dispatch]: https://developer.github.com/v3/repos/#create-a-repository-dispatch-event
