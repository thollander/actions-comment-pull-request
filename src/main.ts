const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const message = core.getInput("message");
    const github_token = core.getInput("GITHUB_TOKEN");

    const context = github.context;
    const pull_request_number =
      core.getInput("pr_number") || context.payload.pull_request?.number;

    if (!pull_request_number) {
      core.setFailed("No pull request found.");
      return;
    }

    const octokit = new github.GitHub(github_token);
    octokit.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number,
      body: message,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
