# Comment Pull Request - GitHub Actions

## What is it ?

A GitHub action that comments with a given message the pull request linked to the pushed branch.
You can even put dynamic data thanks to [Contexts and expression syntax](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/contexts-and-expression-syntax-for-github-actions).

## Usage

### Classic usage

```
on: pull_request

jobs:
  example_comment_pr:
    runs-on: ubuntu-latest
    name: An example job to comment a PR
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Comment PR
        uses: thollander/actions-comment-pull-request@v1

        with:
          message: 'Example of message !'
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

See examples in [opened PR](https://github.com/thollander/actions-comment-pull-request/pulls) !

:information_source: : Add `if: ${{ github.event_name == 'pull_request' }}` to this Action's step if your workflow is not only triggered by a `pull_request` event. It will ensure that you don't throw an error on this step.

### Specifying which pull request to comment on

You can explicitly input which pull request should be commented on by passing the `pr_number` input.
That is particularly useful for manual workflow for instance (`workflow_run`).

```
...
- name: Comment PR
  uses: thollander/actions-comment-pull-request@v1
  with:
    message: 'Example of message !'
    pr_number: 123 # This will comment on pull request #123
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```


### Upsert a comment

Editing an existing comment is also possible thanks to the `comment_includes` property. 
It will search through all the comments of the PR and get the first one that has the `comment_includes` text in it.
If the comment body is not found, it will create a new comment.
That is particularly interesting while committing multiple times in a PR and that you just want to have the last execution report to avoid flooding the PR. 

```
...
- name: Comment PR
  uses: thollander/actions-comment-pull-request@v1
  with:
    message: 'Loading ...'
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
...
- name: Edit PR comment
  uses: thollander/actions-comment-pull-request@v1
  with:
    message: 'Content loaded ! (edited)'
    comment_includes: 'Loading'
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs 

### Action inputs

| Name | Description | Default |
| --- | --- | --- |
| `GITHUB_TOKEN` | Token that is used to create comments | |
| `pr_number` | The number of the pull request where to create the comment | |
| `message` | The comment body | |
| `comment_includes` | The text that should be used in case of comment replacement. | |

## Contributing

### Build

The build steps transpiles the `src/main.ts` to `lib/main.js` which is used in the Docker container.
It is handled by Typescript compiler.

```sh
$ npm run build
```

## Disclaimer

If you prefer not to download a full action, this can now be easily done thanks to [github scripts](https://github.com/actions/github-script).

```yml
- name: 'Comment PR'
  uses: actions/github-script@0.3.0
  if: github.event_name == 'pull_request'
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      const { issue: { number: issue_number }, repo: { owner, repo }  } = context;
      github.issues.createComment({ issue_number, owner, repo, body: 'Hello world ! 👋' });
```
