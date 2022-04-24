"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
async function run() {
    try {
        const message = core.getInput('message');
        const github_token = core.getInput('GITHUB_TOKEN');
        const pr_number = core.getInput('pr_number');
        const comment_includes = core.getInput('comment_includes');
        const context = github.context;
        const pull_number = parseInt(pr_number) || context.payload.pull_request?.number;
        const octokit = github.getOctokit(github_token);
        if (!pull_number) {
            core.setFailed('No pull request in input neither in current context.');
            return;
        }
        if (comment_includes) {
            let comment;
            for await (const { data: comments } of octokit.paginate.iterator(octokit.rest.issues.listComments, {
                ...context.repo,
                issue_number: pull_number,
            })) {
                comment = comments.find((comment) => comment?.body?.includes(comment_includes));
                if (comment)
                    break;
            }
            if (comment) {
                await octokit.rest.issues.updateComment({
                    ...context.repo,
                    comment_id: comment.id,
                    body: message,
                });
                return;
            }
            else {
                core.info('No comment has been found with asked pattern. Creating a new comment.');
            }
        }
        await octokit.rest.issues.createComment({
            ...context.repo,
            issue_number: pull_number,
            body: message,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}
run();
