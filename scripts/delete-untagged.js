// @ts-check
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */

module.exports = async ({ github, context, core }) => {
  const respPackages = await github.request(`GET /orgs/{org}/packages`, {
    package_type: "container",
    org: context.repo.owner,
  });
  respPackages.data.forEach(async (pack) => {
    const packName = pack.name;
    console.log(`清理 ${packName}`);
    const response = await github.request(
      `GET /orgs/${context.repo.owner}/packages/container/${packName}/versions`,
      { per_page: 100 }
    );
    response.data.forEach(async (version) => {
      if (version.metadata.container.tags.length == 0) {
        console.log(`删除 ${version.id}`);
        const deleteResponse = await github.request(
          `DELETE /orgs/${context.repo.owner}/packages/container/${packName}/versions/${version.id}`,
          {}
        );
        console.log(`删除 ${version.id} 的结果: ${deleteResponse.status}`);
      }
    });
  });
};
