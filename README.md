# Comment Pull Request - GitHub Actions

## What is it ?

A GitHub action that comments with a given message the pull request linked to the pushed branch.
You can even put dynamic data thanks to [Contexts and expression syntax](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/contexts-and-expression-syntax-for-github-actions).

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
        uses: thollander/actions-comment-pull-request@v1
        
        with:
          message: 'Example of message !'
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

See examples in [opened PR](https://github.com/thollander/actions-comment-pull-request/pulls) !

:information_source: : Add `if: ${{ github.event_name == 'pull_request' }}` to this Action's step if your workflow is not only triggered by a `pull_request` event. It will ensure that you don't throw an error on this step. 

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
