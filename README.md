# Comment Pull Request - GitHub Actions

A GitHub action that comments with a given message the pull request linked to the pushed branch.

## Usage

```
on: pull_request

jobs:
  example_comment_pr:
    runs-on: ubuntu-latest
    name: An example job to comment a PR
    steps:
      - name: Checkout
        uses: actions/checkout@v1

      - name: Comment PR
        uses: thollander/actions-comment-pull-request
        with:
          message: 'Example of message !'
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

See [#1](https://github.com/thollander/actions-comment-pull-request/pull/1) for example !

:information_source: : Make sure to listen to `pull_request` events. 
Otherwise, it will not be able to comment the PR and you'll have an error. 

## Contributing

### Build 

The build steps transpiles the `src/main.ts` to `lib/main.js` which is used in the Docker container. 
It is handled by Typescript compiler. 

```sh
$ npm run build
```