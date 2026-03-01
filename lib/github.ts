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

  const [{ data: workflowRuns }, { data: pullRequests }] = await Promise.all([
    octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: 50,
    }),
    octokit.rest.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: 50,
    }),
  ]);

  return {
    workflowRuns: workflowRuns.workflow_runs,
    pullRequests,
  };
}
