import * as github from '@actions/github';
import * as core from '@actions/core';

async function run() {
  try {
    const message: string = core.getInput('message');
    const github_token: string = core.getInput('GITHUB_TOKEN');
    const pr_number: string = core.getInput('pr_number');

    const context = github.context;
    const pull_number = parseInt(pr_number) || context.payload.pull_request?.number;

    const octokit = github.getOctokit(github_token);

    if (!pull_number) {
      core.setFailed('No pull request in input neither in current context.');
      return;
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
