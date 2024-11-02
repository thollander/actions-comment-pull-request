import * as github from '@actions/github';
import * as core from '@actions/core';

async function run() {
  try {
    const githubToken: string = core.getInput('github-token');
    const prNumber: string = core.getInput('pr-number');
    const commentTag: string = core.getInput('comment-tag');
    const mode: string = core.getInput('mode');

    if (mode !== 'delete-on-completion') {
      core.debug('This comment was not to be deleted on completion. Skipping');
      return;
    }

    if (!commentTag) {
      core.debug("No 'comment-tag' parameter passed in. Cannot search for something to delete.");
      return;
    }

    const context = github.context;
    const issueNumber = parseInt(prNumber) || context.payload.pull_request?.number || context.payload.issue?.number;

    const octokit = github.getOctokit(githubToken);

    if (!issueNumber) {
      core.setFailed('No issue/pull request in input neither in current context.');
      return;
    }

    const commentTagPattern = `<!-- thollander/actions-comment-pull-request "${commentTag}" -->`;

    if (commentTagPattern) {
      for await (const { data: comments } of octokit.paginate.iterator(octokit.rest.issues.listComments, {
        ...context.repo,
        issue_number: issueNumber,
      })) {
        const commentsToDelete = comments.filter((comment) => comment?.body?.includes(commentTagPattern));
        for (const commentToDelete of commentsToDelete) {
          core.info(`Deleting comment ${commentToDelete.id}.`);
          await octokit.rest.issues.deleteComment({
            ...context.repo,
            comment_id: commentToDelete.id,
          });
        }
      }
    }
    return;
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
