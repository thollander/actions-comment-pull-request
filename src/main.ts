import * as github from '@actions/github';
import * as core from '@actions/core';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

async function run() {
  try {
    const message: string = core.getInput('message');
    const github_token: string = core.getInput('GITHUB_TOKEN');
    const pr_number: string = core.getInput('pr_number');
    const comment_includes: string = core.getInput('comment_includes');

    const context = github.context;
    const pull_number = parseInt(pr_number) || context.payload.pull_request?.number;

    const octokit = github.getOctokit(github_token);

    if (!pull_number) {
      core.setFailed('No pull request in input neither in current context.');
      return;
    }
    
    if (comment_includes) {
      type ListCommentsResponseDataType = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.issues.listComments>;
      let comment: ListCommentsResponseDataType[0] | undefined;
      for await (const { data: comments } of octokit.paginate.iterator(octokit.rest.issues.listComments, {
        ...context.repo,
        issue_number: pull_number,
      })) {
        comment = comments.find((comment) => comment?.body?.includes(comment_includes));
        if (comment) break;
      }

      if (comment) {
        await octokit.rest.issues.updateComment({
          ...context.repo,
          comment_id: comment.id,
          body: message,
        });
        return;
      } else {
        core.info('No comment has been found with asked pattern. Creating a new comment.');
      }
    }

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_number,
      body: message,
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
