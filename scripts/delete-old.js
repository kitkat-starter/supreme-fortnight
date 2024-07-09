// @ts-check
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */

module.exports = async ({ github, context, core }) => {
  const respPackages = await github.request(`GET /orgs/{org}/packages`, {
    package_type: "container",
    org: context.repo.owner,
  });
  respPackages.data.forEach(async (pack) => {
    const packName = pack.name;
    console.log(`清理包 ${packName}`);
    const response = await github.request(
      `GET /orgs/${context.repo.owner}/packages/container/${packName}/versions`,
      { per_page: 100 },
    );
    response.data.forEach(async (version) => {
      // 不含 tag 的不要管,留给 action 处理
      if (version.metadata.container.tags.length == 0) {
        return;
      }
      // 判断 version.updated_at 距离现在是否超过 30 天
      const now = new Date();
      const updatedAt = new Date(version.updated_at);
      const diff = now.getTime() - updatedAt.getTime();
      const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
      if (diffDays < 30) {
        console.log(`跳过 ${version.id}，因为 ${diffDays} 天前更新的`);
        return;
      }
      console.log(`删除 ${version.id}`);
      const deleteResponse = await github.request(
        `DELETE /orgs/${context.repo.owner}/packages/container/${packName}/versions/${version.id}`,
        {},
      );
    });
  });
};
