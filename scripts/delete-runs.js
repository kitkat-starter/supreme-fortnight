// @ts-check
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */

module.exports = async ({ github, context, core }) => {
  const actionRuns = await github.request(
    `GET /repos/{owner}/{repo}/actions/runs`,
    {
      status: "completed",
      repo: context.repo.repo,
      owner: context.repo.owner,
      per_page: 100,
    }
  );
  actionRuns.data.workflow_runs.forEach(async (run) => {
    console.log(`清理 ${run.id}`);
    const response = await github.request(
      `DELETE /repos/{owner}/{repo}/actions/runs/{run_id}`,
      {
        run_id: run.id,
        repo: context.repo.repo,
        owner: context.repo.owner,
      }
    );
    console.log(`删除 ${run.id} 的结果: ${response.status}`);
  });
};
