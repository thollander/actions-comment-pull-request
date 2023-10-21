# Comment Pull Request - GitHub Actions

## What is it ?

A GitHub action that comments with a given message the pull request linked to the pushed branch.
You can even put dynamic data thanks to [Contexts and expression syntax](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/contexts-and-expression-syntax-for-github-actions).

## Usage

### Classic usage

```yml
on: pull_request

jobs:
  example_comment_pr:
    runs-on: ubuntu-latest
    name: An example job to comment a PR
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Comment PR
        uses: thollander/actions-comment-pull-request@v2
        with:
          message: |
            Hello world ! :wave:
```

### Comment a file content

Thanks to the `filePath` input, a file content can be commented.
You can either pass an absolute filePath or a relative one that will be by default retrieved from `GITHUB_WORKSPACE`. 
(Note that if both a `message` and `filePath` are provided, `message` will take precedence.)

```yml
- name: PR comment with file
  uses: thollander/actions-comment-pull-request@v2
  with:
    filePath: /path/to/file.txt
```


### Setting reactions

You can also set some reactions on your comments through the `reactions` input.
It takes only valid reactions and adds it to the comment you've just created. (See https://docs.github.com/en/rest/reactions#reaction-types)

```yml
- name: PR comment with reactions
  uses: thollander/actions-comment-pull-request@v2
  with:
    message: |
      Hello world ! :wave:
    reactions: eyes, rocket
```

### Specifying which pull request to comment on

You can explicitly input which pull request should be commented on by passing the `pr_number` input.
That is particularly useful for manual workflow for instance (`workflow_run`).

```yml
...
- name: Comment PR
  uses: thollander/actions-comment-pull-request@v2
  with:
    message: |
      Hello world ! :wave:
    pr_number: 123 # This will comment on pull request #123
```


### Update a comment

Editing an existing comment is also possible thanks to the `comment_tag` input.

Thanks to this parameter, it will be possible to identify your comment and then to upsert on it. 
If the comment is not found at first, it will create a new comment.

_That is particularly interesting while committing multiple times in a PR and that you just want to have the last execution report printed. It avoids flooding the PR._

```yml
...
- name: Comment PR with execution number
  uses: thollander/actions-comment-pull-request@v2
  with:
    message: |
      _(execution **${{ github.run_id }}** / attempt **${{ github.run_attempt }}**)_
    comment_tag: execution
```

Note: the input `mode` can be used to either `upsert` (by default) or `recreate` the comment (= delete and create)

### Delete a comment

Deleting an existing comment is also possible thanks to the `comment_tag` input combined with `mode: delete`.

This will delete the comment at the end of the job. 

```yml
...
- name: Write a comment that will be deleted at the end of the job
  uses: thollander/actions-comment-pull-request@v2
  with:
    message: |
      The PR is being built...
    comment_tag: to_delete
    mode: delete

```

## Inputs 

### Action inputs

| Name | Description | Required | Default |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | Token that is used to create comments. Defaults to ${{ github.token }} | ✅ | |
| `message` | Comment body | | |
| `filePath` | Path of the file that should be commented | | |
| `reactions` | List of reactions for the comment (comma separated). See https://docs.github.com/en/rest/reactions#reaction-types  | | |
| `pr_number` | The number of the pull request where to create the comment | | current pull-request/issue number (deduced from context) |
| `comment_tag` | A tag on your comment that will be used to identify a comment in case of replacement | | |
| `mode` | Mode that will be used to update comment (upsert/recreate/delete) | | upsert |
| `create_if_not_exists` | Whether a comment should be created even if `comment_tag` is not found | | true |


## Outputs 

### Action outputs

You can get some outputs from this actions : 

| Name | Description |
| --- | --- |
| `id` | Comment id that was created or updated | 
| `body` | Comment body |
| `html_url` | URL of the comment created or updated |

## Example 

```yaml
- name: Comment PR
  uses: thollander/actions-comment-pull-request@v2
  id: hello
  with:
    message: |
      Hello world ! :wave:
- name: Check outputs
  run: |
    echo "id : ${{ steps.hello.outputs.id }}"
    echo "body : ${{ steps.hello.outputs.body }}"
    echo "html_url : ${{ steps.hello.outputs.html_url }}"
```

## Permissions

Depending on the permissions granted to your token, you may lack some rights. 
To run successfully, this actions needs at least : 

```yaml
permissions: 
   pull-requests: write 
```

Add this in case you get `Resource not accessible by integration` error.
See [jobs.<job_id>.permissions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idpermissions) for more information.


> Note that, if the PR comes from a fork, it will have only read permission despite the permissions given in the action for the `pull_request` event.
> In this case, you may use the `pull_request_target` event. With this event, permissions can be given without issue (the difference is that it will execute the action from the target branch and not from the origin PR).

## Contributing

### Build

The build steps transpiles the `src/main.ts` to `lib/index.js` which is used in a NodeJS environment.
It is handled by `vercel/ncc` compiler.

```sh
$ npm run build
```
