const fs = require("fs-extra");
const klawSync = require("klaw-sync");
const path = require("path");
const workflowData = require("./workflow");
const YAML = require("yaml");

function genWorkflowMain(config, workflowConfig) {
	let workflowMain = Object.assign({}, workflowData.workflowMain);
	workflowMain.name = workflowConfig.workflowName;
	// 清空 jobs
	workflowMain.jobs = {};
	// 添加对文件的关注
	workflowMain.on.push.paths = [
		workflowConfig.dockerfilePath,
		workflowConfig.entrypointPath,
		workflowConfig.workflowFileName,
	];
	workflowMain.on.schedule = workflowConfig.schedule;
	// 或者是一些需要额外观察的
	let extraScanFiles = config.extraScanFiles;
	if (extraScanFiles.length > 0) {
		extraScanFiles.forEach((extraFile) => {
			let extraWatchFile = `${config.path + path.sep + extraFile}`;
			// 还要判断文件是否存在
			console.log(`额外观察的文件 ${extraWatchFile}`);
			console.log(`Context ${workflowConfig.context}`);
			// 在额外观察目录包含 Context 目录的时候
			if (extraWatchFile.includes(workflowConfig.context)) {
				console.log(`额外观察的文件 ${extraWatchFile} 包含 Context 目录`);
				// 将额外观察的文件路径添加到 on.push.paths 中
				workflowMain.on.push.paths.push(extraWatchFile);
			}
		});
		// workflowMain.on.push.paths.push(extraWatchFile);
	}
	return workflowMain;
}
function genBuildJob(workflowConfig) {
	let buildJob = Object.assign({}, workflowData.buildJob);
	// console.log(workflowData.buildJob);
	// console.log(buildJob);
	// 我们要修改一下构建信息
	buildJob.steps.forEach((step) => {
		if (step.uses == "docker/build-push-action@v2") {
			// 说明找到了
			// console.log("找到了要修改的部分");
			step.with.context = workflowConfig.context;
			step.with.file = workflowConfig.dockerfilePath;
			step.with.tags = workflowConfig.pushTarget;
			step.name = workflowConfig.workflowName;
		}
	});
	return buildJob;
}
function genSyncJob(workflowConfig) {
	let syncJob = Object.assign({}, workflowData.syncJob);
	syncJob.needs = [];
	syncJob.needs.push(workflowConfig.buildJobName);
	// console.log(syncJob);
	let syncSteps = syncJob.steps;
	let syncJobLength = syncSteps.length;
	// 修改同步文件路径
	syncSteps[
		syncJobLength - 1
	].run = `./image-syncer -r 5 --proc 16 --auth ./sync-tool/auth.json --images ${workflowConfig.syncConfigFile}`;
	// console.log(syncSteps[syncJobLength - 1]);
	return syncJob;
}
function genSyncConfig(config, tag) {
	// 生成同步的文件信息
	let registry = config.registry;
	let mirror = config.mirror;
	// Support GHCR
	let registryTarget = `${registry}:${tag}`;
	let mirrorTarget = `${mirror}:${tag}`;
	// 这是一个 ES6 语法
	let syncConfig = {
		[registryTarget]: mirrorTarget,
	};
	return syncConfig;
}
// 开始!
let configJsonStr = fs
	.readFileSync(path.join(path.dirname(__filename), "config.json"))
	.toString();
let configJson = JSON.parse(configJsonStr);
// 扫数组
configJson.paths.forEach((config) => {
	// console.log(path);
	let dockerfileScanPath = path.join(process.cwd(), config.path);
	// console.log(scanPath);
	// 根据配置文件扫描目录
	const files = klawSync(dockerfileScanPath, { nodir: false });
	files.forEach((filePath) => {
		let filename = filePath.path.split(path.sep).pop();
		// console.log(filePath.stats.isDirectory());
		// console.log(filename);
		if (filename.startsWith("Dockerfile")) {
			// console.log(filePath.path);
			// console.log(filename);
			let tag = "";
			let context = "";
			if (filename == "Dockerfile") {
				// 如果名字刚好等于 Dockerfile
				// 那就用文件夹的名字作为 tag
				tag = path.dirname(filePath.path).split(path.sep).pop();
				// 同时应该使用上一级相对路径来作为 context
			} else {
				// 那就用后面的部分作为 tag
				tag = filename.replace("Dockerfile-", "");
			}
			let registry = config.registry;
			// 这里要用正则匹配
			let regExp = new RegExp(path.sep, "g");
			let taskId = config.path.replace(regExp, "-");
			// 计算一些其他数据
			context = path.dirname(filePath.path).replace(process.cwd() + "/", "");
			let pushTarget = `${registry}:${tag}`;
			let dockerfilePath = `${context + path.sep + filename}`;
			let entrypointPath = `${context + path.sep}entrypoint.sh`;
			let workflowName = `构建 ${taskId}-${tag} 镜像`;
			let workflowFileName = `.github/workflows/${taskId}-${tag}.yml`;
			let buildJobName = `build-${taskId}-${tag}`;
			let syncConfigFile = `${context}/${tag}.yml`;
			// console.log(`镜像tag: ${tag}`);
			// console.log("任务前缀: " + taskPerfix);
			// console.log("镜像注册表: " + registry);
			// console.log("组合起来的镜像地址: " + `${registry}:${tag}`);
			// console.log(`上下文路径: ${context}`);
			// console.log(`Dockerfile路径: ${dockerfilePath}`);
			// console.log(`同步配置文件路径: ${syncConfigFile}`);
			console.log(`工作流名称: ${workflowName}`);
			let workflowConfig = {
				pushTarget: pushTarget,
				context: context,
				dockerfilePath: dockerfilePath,
				workflowName: workflowName,
				workflowFileName: workflowFileName,
				buildJobName: buildJobName,
				syncConfigFile: syncConfigFile,
				schedule: config.schedule,
				entrypointPath: entrypointPath,
			};
			// 制作同步配置文件
			// 左边是 registry:tag
			// 右边是 mirror:tag
			let syncConfig = genSyncConfig(config, tag);
			// 开始填充工作流文件
			// 首先修改主体框架
			let workflowMain = genWorkflowMain(config, workflowConfig);
			// 修改构建阶段
			let buildJob = genBuildJob(workflowConfig);
			// 修改同步阶段
			let syncJob = genSyncJob(workflowConfig);
			// 把两个任务塞进去
			workflowMain.jobs[buildJobName] = buildJob;
			workflowMain.jobs["sync-back"] = syncJob;
			// 序列化
			YAML.scalarOptions.str.fold.lineWidth = 0;
			let workflowFileStr = YAML.stringify(workflowMain);
			let syncConfigStr = YAML.stringify(syncConfig);
			// fs.writeFileSync(
			// 	`${process.cwd()}/.github/test/${taskId}-${tag}.yml`,
			// 	workflowFileStr
			// );
			// 写入工作流配置
			fs.writeFileSync(workflowFileName, workflowFileStr);
			// 写入同步配置
			fs.writeFileSync(syncConfigFile, syncConfigStr);
		}
	});
});
