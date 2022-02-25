const YAML = require("yamljs");
const fs = require("fs-extra");
const klawSync = require("klaw-sync");

// file为文件所在路径
const files = klawSync("./.github/workflows/v1/", { nodir: true });
files.forEach((file) => {
  filePath = file.path;
  var parsedFile = YAML.parse(fs.readFileSync(filePath).toString());
  v2Object = convertV1ToV2(parsedFile);
  v2String = YAML.stringify(v2Object, 6);
  // console.log(v2String);
  newFilePath = filePath.replace("v1", "");
  fs.writeFileSync(newFilePath, v2String);
});

function convertV1ToV2(data) {
  for (jobName in data.jobs) {
    // console.log(job["runs-on"]);
    if (jobName.includes("build")) {
      steps = data.jobs[jobName].steps;
      // console.log(steps);
      steps.forEach((step) => {
        // console.log(step);
        if (step.uses == "docker/build-push-action@v2") {
          // console.log(step.with);
          // 注意 这么做是引用传递
          stepParameters = step.with;
          // 删除 username password registry
          // delete step.with.username;
          // delete step.with.password;
          delete stepParameters.username;
          delete stepParameters.password;
          delete stepParameters.registry;
          // path 改为 context
          stepParameters.context = stepParameters.path;
          delete stepParameters.path;
          // dockerfile 改为 file
          stepParameters.file = stepParameters.dockerfile;
          delete stepParameters.dockerfile;
          // push 设定为 true
          stepParameters.push = true;
          // tags 是 repository:tags
          oldTags = stepParameters.tags;
          repository = stepParameters.repository;
          stepParameters.tags = repository + ":" + oldTags;
          delete stepParameters.repository;
          // console.log(step.with);
        }
      });
      // 开始插入其他内容
      appendSteps = [
        {
          name: "设定 Docker Buildx",
          uses: "docker/setup-buildx-action@v1",
        },
        {
          name: "登陆到 DockerHub",
          uses: "docker/login-action@v1",
          with: {
            username: "${{ secrets.HUB_USERNAME }}",
            password: "${{ secrets.HUB_PASSWORD }}",
          },
        },
      ];
      // 开始插入
      appendSteps.forEach((newStep) => {
        // console.log(steps);
        steps.splice(1, 0, newStep);
        // console.log(steps);
      });
    }
  }
  return data;
}
