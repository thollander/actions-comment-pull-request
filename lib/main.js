"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const github = require('@actions/github');
const core = require('@actions/core');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const message = core.getInput("message");
            const github_token = core.getInput("GITHUB_TOKEN");
            const context = github.context;
            if (context.payload.pull_request == null) {
                core.setFailed("No pull request found.");
                return;
            }
            const pull_request_number = context.payload.pull_request.number;
            const octokit = github.getOctokit(github_token);
            const new_comment = yield octokit.rest.issues.createComment(Object.assign(Object.assign({}, context.repo), { issue_number: pull_request_number, body: message }));
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
        }
    });
}
run();
