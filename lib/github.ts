import { Octokit } from "octokit";

export const getOctokit = (accessToken: string) => {
  return new Octokit({ auth: accessToken });
};

export async function fetchUserRepos(accessToken: string) {
  const octokit = getOctokit(accessToken);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });
  return data;
}

export async function fetchRepoMetrics(accessToken: string, owner: string, repo: string) {
  const octokit = getOctokit(accessToken);

  // Fetch Workflow Runs
  const { data: workflowRuns } = await octokit.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: 50,
  });

  // Fetch Pull Requests
  const { data: pullRequests } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "all",
    per_page: 50,
  });

  // Fetch Commits
  const { data: commits } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    per_page: 50,
  });

  return {
    workflowRuns: workflowRuns.workflow_runs,
    pullRequests,
    commits,
  };
}
