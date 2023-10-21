import fs from 'fs';
import * as github from '@actions/github';
import * as core from '@actions/core';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

// See https://docs.github.com/en/rest/reactions#reaction-types
const REACTIONS = ['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'] as const;
type Reaction = (typeof REACTIONS)[number];

async function run() {
  try {
    const message: string = core.getInput('message');
    const filePath: string = core.getInput('filePath');
    const github_token: string = core.getInput('GITHUB_TOKEN');
    const pr_number: string = core.getInput('pr_number');
    const comment_tag: string = core.getInput('comment_tag');
    const reactions: string = core.getInput('reactions');
    const mode: string = core.getInput('mode');
    const create_if_not_exists: boolean = core.getInput('create_if_not_exists') === 'true';

    if (!message && !filePath) {
      core.setFailed('Either "filePath" or "message" should be provided as input');
      return;
    }

    let content: string = message;
    if (!message && filePath) {
      content = fs.readFileSync(filePath, 'utf8');
    }

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

    async function createComment({
      owner,
      repo,
      issue_number,
      body,
    }: {
      owner: string;
      repo: string;
      issue_number: number;
      body: string;
    }) {
      const { data: comment } = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body,
      });

      core.setOutput('id', comment.id);
      core.setOutput('body', comment.body);
      core.setOutput('html_url', comment.html_url);

      await addReactions(comment.id, reactions);

      return comment;
    }

    async function updateComment({
      owner,
      repo,
      comment_id,
      body,
    }: {
      owner: string;
      repo: string;
      comment_id: number;
      body: string;
    }) {
      const { data: comment } = await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id,
        body,
      });

      core.setOutput('id', comment.id);
      core.setOutput('body', comment.body);
      core.setOutput('html_url', comment.html_url);

      await addReactions(comment.id, reactions);

      return comment;
    }

    async function deleteComment({ owner, repo, comment_id }: { owner: string; repo: string; comment_id: number }) {
      const { data: comment } = await octokit.rest.issues.deleteComment({
        owner,
        repo,
        comment_id,
      });

      return comment;
    }

    const comment_tag_pattern = comment_tag
      ? `<!-- thollander/actions-comment-pull-request "${comment_tag}" -->`
      : null;
    const body = comment_tag_pattern ? `${content}\n${comment_tag_pattern}` : content;

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
          await updateComment({
            ...context.repo,
            comment_id: comment.id,
            body,
          });
          return;
        } else if (mode === 'recreate') {
          await deleteComment({
            ...context.repo,
            comment_id: comment.id,
          });

          await createComment({
            ...context.repo,
            issue_number,
            body,
          });
          return;
        } else if (mode === 'delete') {
          core.debug('Registering this comment to be deleted.');
        } else {
          core.setFailed(`Mode ${mode} is unknown. Please use 'upsert', 'recreate' or 'delete'.`);
          return;
        }
      } else if (create_if_not_exists) {
        core.info('No comment has been found with asked pattern. Creating a new comment.');
      } else {
        core.info(
          'Not creating comment as the pattern has not been found. Use `create_if_not_exists: true` to create a new comment anyway.',
        );
        return;
      }
    }

    await createComment({
      ...context.repo,
      issue_number,
      body,
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
