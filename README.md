# dpx <img src="send.svg" align="bottom" height="24px" />

This is a utility for sending [repository dispatch][repository_dispatch] and
[workflow dispatch][workflow_dispatch] events to GitHub repositories.

## Use

This tool attempts to allow you to dispatch events quickly with as little
typing as possible, provided you've got your environment set up for it:

- You can avoid passing a GitHub token manually by setting a `GITHUB_TOKEN`
  environment variable.
- You can avoid passing a GitHub repository by having a git remote called
  "origin" in your .git/config that points to a GitHub repository
- By default, dpx attempts to parse values as JSON (pass `--raw` to avoid this)
- The presence of the `-w/--workflow` flag indicates dpx should send a
  workflow dispatch event instead of a repository dispatch event.

```shell
# Send a "test" repo dispatch event.
> npx dpx test

# Send a "deploy" repo dispatch event with a payload `{"branch": "master"}`.
> npx dpx deploy branch=master

# Send a "db-migrate" repo dispatch event with a payload `{"direction": "up", "count": 1}`
> npx dpx db-migrate direction=up count=1

# Send a "db-migrate" repo dispatch event with a payload `{"direction": "up", "count": "1"}`
> npx dpx --raw db-migrate direction=up count=1

# Trigger the "test.yml" workflow on the "dev" branch with the payload `{"fast": "true"}`
> npx dpx -w test.yml -f dev fast=true
```

### Flags & Arguments

- `-r`/`--repo` A name-with-owner string (as in `jclem/dpx`) pointing to the
  repository for the dispatch to be sent to
- `-t`/`--token` A GitHub personal access token with `repo` scope
- `-v`/`--version` Display the version of dpx
- `--raw` Do not parse values in key=value pairs
- `-d`/`--dry-run` Log event type and payload, but don't send a request
- `-h`/`--help` Display the help message
- `-w`/`--workflow` The workflow to use for a workflow dispatch event
- `-f`/`--ref` The ref to run from for a workflow dispatch event (defaults to the default branch of the repository)
- `$event` The first non-flag argument is interpreted as the event for repository dispatches
- `$key=$value` Any number of key-value pairs that are parsed and sent as a
  JSON object as the event payload

## Context

In the GitHub ecosystem, a repository dispatch event is an event sent to a
particular GitHub repository by a user, app, or tool with an arbitrary type
and JSON payload. A workflow dispatch is an event that triggers a single
workflow with a predefined set of inputs.

Since GitHub Actions allows workflows to be kicked off by these events, this
flexibility makes repository and workflow dispatches a powerful tool for
automating many day-to-day async tasks, such as app deployments, building and
packaging, and many other use cases.

[repository_dispatch]: https://docs.github.com/en/free-pro-team@latest/rest/reference/repos#create-a-repository-dispatch-event
[workflow_dispatch]: https://docs.github.com/en/free-pro-team@latest/rest/reference/actions#create-a-workflow-dispatch-event
