import * as github from '@actions/github';
import * as core from '@actions/core';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

async function run() {
  try {
    const github_token: string = core.getInput('GITHUB_TOKEN');
    const pr_number: string = core.getInput('pr_number');
    const comment_tag: string = core.getInput('comment_tag');
    const mode: string = core.getInput('mode');

    if (mode !== 'delete') {
      core.debug('This comment was not to be deleted. Skipping');
      return;
    }

    if (!comment_tag) {
      core.debug("No 'comment_tag' parameter passed in. Cannot search for something to delete.");
      return;
    }

    const context = github.context;
    const issue_number = parseInt(pr_number) || context.payload.pull_request?.number || context.payload.issue?.number;

    const octokit = github.getOctokit(github_token);

    if (!issue_number) {
      core.setFailed('No issue/pull request in input neither in current context.');
      return;
    }

    const comment_tag_pattern = `<!-- thollander/actions-comment-pull-request "${comment_tag}" -->`;

    if (comment_tag_pattern) {
      type ListCommentsResponseDataType = GetResponseDataTypeFromEndpointMethod<
        typeof octokit.rest.issues.listComments
      >;
      let comment: ListCommentsResponseDataType[0] | undefined;
      for await (const { data: comments } of octokit.paginate.iterator(octokit.rest.issues.listComments, {
        ...context.repo,
        issue_number,
      })) {
        comment = comments.find((comment) => comment?.body?.includes(comment_tag_pattern));
        if (comment) break;
      }

      if (comment) {
        core.info(`Deleting comment ${comment.id}.`);
        await octokit.rest.issues.deleteComment({
          ...context.repo,
          comment_id: comment.id,
        });
        return;
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
