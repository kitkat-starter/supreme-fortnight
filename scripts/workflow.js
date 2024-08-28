const workflowMain = {
  name: "构建镜像",
  on: {
    push: {
      paths: [
        // "er/entrypoint.sh",
      ],
    },
    schedule: [
      {
        cron: "0 14 * * 1",
      },
    ],
    workflow_dispatch: {},
  },
  env: {
    TKE_USERNAME: "${{ secrets.TKE_USERNAME }}",
    TKE_PASSWORD: "${{ secrets.TKE_PASSWORD }}",
    // ACR_USERNAME: "${{ secrets.ACR_USERNAME }}",
    // ACR_PASSWORD: "${{ secrets.ACR_PASSWORD }}",
    // ACR_XL_USERNAME: "${{ secrets.ACR_XL_USERNAME }}",
    // ACR_XL_PASSWORD: "${{ secrets.ACR_XL_PASSWORD }}",
    HUB_USERNAME: "${{ secrets.HUB_USERNAME }}",
    HUB_PASSWORD: "${{ secrets.HUB_PASSWORD }}",
    GHCR_USERNAME: "${{ github.actor }}",
    GHCR_PASSWORD: "${{ secrets.GITHUB_TOKEN }}",
  },
  jobs: {},
};
const buildJob = {
  "runs-on": "ubuntu-latest",

  steps: [
    {
      name: "检出代码",
      uses: "actions/checkout@v4",
    },
    {
      name: "设定 Docker Buildx",
      uses: "docker/setup-buildx-action@v3",
    },
    {
      name: "登陆到 DockerHub",
      uses: "docker/login-action@v3",
      with: {
        registry: "ghcr.io",
        // username: "${{ secrets.HUB_USERNAME }}",
        // password: "${{ secrets.HUB_PASSWORD }}",
        username: "${{ github.actor }}",
        password: "${{ secrets.GITHUB_TOKEN }}",
      },
    },
    {
      name: "构建 镜像",
      uses: "docker/build-push-action@v5",
      with: {
        context: "",
        file: "",
        push: true,
        tags: "",
        "cache-from": "type=gha",
        "cache-to": "type=gha,mode=max",
      },
    },
  ],
};
const syncJob = {
  "runs-on": "ubuntu-latest",
  needs: [],
  steps: [
    {
      name: "检出代码",
      uses: "actions/checkout@v4",
    },
    {
      name: "准备同步工具",
      run: "bash ./sync-tool/tools.sh",
    },
    {
      name: "搬回国内",
      run: "./image-syncer -r 5 --proc 16 --auth ./sync-tool/auth.json --images ${syncConfigFile}",
    },
  ],
};
module.exports = {
  workflowMain: workflowMain,
  buildJob: buildJob,
  syncJob: syncJob,
};
