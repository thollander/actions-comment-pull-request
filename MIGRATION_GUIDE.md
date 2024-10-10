# Migration guide

## From v2 to v3

### Parameters

- From `filePath` to `file-path` 
- From `GITHUB_TOKEN` to `github-token`
- From `pr_number` to `pr-number`
- From `comment_tag` to `comment-tag`
- From `create_if_not_exists` to `create-if-not-exists`

### Mode

`delete` now deletes a comment immediately. To delete the comment at the end of the job, use `delete-on-completion` mode.