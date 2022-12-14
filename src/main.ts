import * as github from '@actions/github';
import * as core from '@actions/core';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

// See https://docs.github.com/en/rest/reactions#reaction-types
const REACTIONS = ['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'] as const;
type Reaction = typeof REACTIONS[number];

async function run() {
  try {
    const message: string = core.getInput('message');
    const github_token: string = core.getInput('GITHUB_TOKEN');
    const pr_number: string = core.getInput('pr_number');
    const comment_tag: string = core.getInput('comment_tag');
    const reactions: string = core.getInput('reactions');
    const mode: string = core.getInput('mode');

    const context = github.context;
    const issue_number = parseInt(pr_number) || context.payload.pull_request?.number || context.payload.issue?.number;

    const octokit = github.getOctokit(github_token);

    if (!issue_number) {
      core.setFailed('No issue/pull request in input neither in current context.');
      return;
    }

    async function addReactions(comment_id: number, reactions: string) {
      const validReactions = <Reaction[]>reactions
        .replace(/\s/g, '')
        .split(',')
        .filter((reaction) => REACTIONS.includes(<Reaction>reaction));

      await Promise.allSettled(
        validReactions.map(async (content) => {
          await octokit.rest.reactions.createForIssueComment({
            ...context.repo,
            comment_id,
            content,
          });
        }),
      );
    }

    const comment_tag_pattern = comment_tag
      ? `<!-- thollander/actions-comment-pull-request "${comment_tag}" -->`
      : null;
    const body = comment_tag_pattern ? `${message}\n${comment_tag_pattern}` : message;

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
        if (mode === 'upsert') {
          await octokit.rest.issues.updateComment({
            ...context.repo,
            comment_id: comment.id,
            body,
          });
          await addReactions(comment.id, reactions);
          return;
        } else if (mode === 'recreate') {
          await octokit.rest.issues.deleteComment({
            ...context.repo,
            comment_id: comment.id,
          });

          const { data: newComment } = await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number,
            body,
          });

          await addReactions(newComment.id, reactions);
          return;
        } else {
          core.setFailed(`Mode ${mode} is unknown. Please use 'upsert' or 'recreate'.`);
          return;
        }
      } else {
        core.info('No comment has been found with asked pattern. Creating a new comment.');
      }
    }

    const { data: comment } = await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number,
      body,
    });

    await addReactions(comment.id, reactions);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
