# dpx

This is a utility for sending [repository dispatch][dispatch] events to
GitHub repositories.

## Use

- Have `GITHUB_TOKEN` in your environment with `repo` scope (or pass one with
  `-t`).
- You can either pass a name-with-owner ("owner/name") with `-r`, or dpx will
  attempt to read your origin URL from `.git/config`.

```shell
# Send a "test" event
> npx dpx -r my-login/my-repo -e test

# Send a "test" event with a payload `{"foo": "bar"}`, and detect the repo from git
> npx dpx -e test foo=bar
```

[dispatch]: https://developer.github.com/v3/repos/#create-a-repository-dispatch-event
