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
			{ per_page: 100 }
		);
		response.data.forEach(async (version) => {
			if (version.metadata.container.tags.length == 0) {
				// 同时 created_at 距离现在大于 14 天
				// 格式为 2024-08-16T05:37:06Z
				// 才进入删除
				if (
					new Date(version.created_at).getTime() <
					new Date().getTime() - 14 * 24 * 60 * 60 * 1000
				) {
					console.log(`${version.id} 距离现在还没有超过 14 天,不删除`);
					return;
				}
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
