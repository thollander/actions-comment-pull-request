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
    const filePath: string = core.getInput('file-path');
    const githubToken: string = core.getInput('github-token');
    const prNumber: string = core.getInput('pr-number');
    const commentTag: string = core.getInput('comment-tag');
    const reactions: string = core.getInput('reactions');
    const mode: string = core.getInput('mode');
    const createIfNotExists: boolean = core.getInput('create-if-not-exists') === 'true';

    if (!message && !filePath && mode !== 'delete') {
      core.setFailed('Either "filePath" or "message" should be provided as input unless running as "delete".');
      return;
    }

    let content: string = message;
    if (!message && filePath) {
      content = fs.readFileSync(filePath, 'utf8');
    }

    const context = github.context;
    const issueNumber = parseInt(prNumber) || context.payload.pull_request?.number || context.payload.issue?.number;

    const octokit = github.getOctokit(githubToken);

    if (!issueNumber) {
      core.setFailed('No issue/pull request in input neither in current context.');
      return;
    }

    async function addReactions(commentId: number, reactions: string) {
      const validReactions = <Reaction[]>reactions
        .replace(/\s/g, '')
        .split(',')
        .filter((reaction) => REACTIONS.includes(<Reaction>reaction));

      await Promise.allSettled(
        validReactions.map(async (content) => {
          await octokit.rest.reactions.createForIssueComment({
            ...context.repo,
            comment_id: commentId,
            content,
          });
        }),
      );
    }

    async function createComment({
      owner,
      repo,
      issueNumber,
      body,
    }: {
      owner: string;
      repo: string;
      issueNumber: number;
      body: string;
    }) {
      const { data: comment } = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });

      core.setOutput('id', comment.id);
      core.setOutput('body', comment.body);
      core.setOutput('html-url', comment.html_url);

      await addReactions(comment.id, reactions);

      return comment;
    }

    async function updateComment({
      owner,
      repo,
      commentId,
      body,
    }: {
      owner: string;
      repo: string;
      commentId: number;
      body: string;
    }) {
      const { data: comment } = await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body,
      });

      core.setOutput('id', comment.id);
      core.setOutput('body', comment.body);
      core.setOutput('html-url', comment.html_url);

      await addReactions(comment.id, reactions);

      return comment;
    }

    async function deleteComment({ owner, repo, commentId }: { owner: string; repo: string; commentId: number }) {
      const { data: comment } = await octokit.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: commentId,
      });

      return comment;
    }

    const commentTagPattern = commentTag ? `<!-- thollander/actions-comment-pull-request "${commentTag}" -->` : null;
    const body = commentTagPattern ? `${content}\n${commentTagPattern}` : content;

    if (commentTagPattern) {
      type ListCommentsResponseDataType = GetResponseDataTypeFromEndpointMethod<
        typeof octokit.rest.issues.listComments
      >;
      let comment: ListCommentsResponseDataType[0] | undefined;
      for await (const { data: comments } of octokit.paginate.iterator(octokit.rest.issues.listComments, {
        ...context.repo,
        issue_number: issueNumber,
      })) {
        comment = comments.find((comment) => comment?.body?.includes(commentTagPattern));
        if (comment) break;
      }

      if (comment) {
        if (mode === 'upsert') {
          await updateComment({
            ...context.repo,
            commentId: comment.id,
            body,
          });
          return;
        } else if (mode === 'recreate') {
          await deleteComment({
            ...context.repo,
            commentId: comment.id,
          });

          await createComment({
            ...context.repo,
            issueNumber,
            body,
          });
          return;
        } else if (mode === 'delete') {
          await deleteComment({
            ...context.repo,
            commentId: comment.id,
          });
          return;
        } else if (mode === 'delete-on-completion') {
          core.debug('Registering this comment to be deleted.');
        } else {
          core.setFailed(
            `Mode ${mode} is unknown. Please use 'upsert', 'recreate', 'delete' or 'delete-on-completion'.`,
          );
          return;
        }
      } else if (mode === 'delete') {
        core.info('No comment has been found with asked pattern. Nothing to delete.');
        return;
      } else if (createIfNotExists) {
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
      issueNumber,
      body,
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
