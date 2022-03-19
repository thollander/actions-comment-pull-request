import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const message: string = core.getInput("message");
    const github_token: string = core.getInput("GITHUB_TOKEN");

    const context = github.context;
    if (context.payload.pull_request == null) {
      core.setFailed("No pull request found.");
      return;
    }
    const pull_request_number = context.payload.pull_request.number;

    const octokit = github.getOctokit(github_token);
    const new_comment = await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number,
      body: message,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
