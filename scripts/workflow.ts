export interface Step {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}

export interface Job {
  "runs-on": string;
  needs?: string[];
  steps: Step[];
}

export interface WorkflowMain {
  name: string;
  on: {
    push: { paths: string[] };
    schedule: { cron: string }[];
    workflow_dispatch: Record<string, never>;
  };
  permissions: { packages: string };
  env: Record<string, string>;
  jobs: Record<string, Job>;
}

export function workflowMain(): WorkflowMain {
  return {
    name: "构建镜像",
    on: {
      push: { paths: [] },
      schedule: [{ cron: "0 14 * * 1" }],
      workflow_dispatch: {},
    },
    permissions: { packages: "write" },
    env: {
      TKE_USERNAME: "${{ secrets.TKE_USERNAME }}",
      TKE_PASSWORD: "${{ secrets.TKE_PASSWORD }}",
      HUB_USERNAME: "${{ secrets.HUB_USERNAME }}",
      HUB_PASSWORD: "${{ secrets.HUB_PASSWORD }}",
      GHCR_USERNAME: "${{ github.actor }}",
      GHCR_PASSWORD: "${{ secrets.GITHUB_TOKEN }}",
    },
    jobs: {},
  };
}

export function buildJob(): Job {
  return {
    "runs-on": "ubuntu-latest",
    steps: [
      { name: "检出代码", uses: "actions/checkout@v7" },
      { name: "设置 QEMU", uses: "docker/setup-qemu-action@v4" },
      { name: "设定 Docker Buildx", uses: "docker/setup-buildx-action@v4" },
      {
        name: "登陆到 DockerHub",
        uses: "docker/login-action@v4",
        with: {
          registry: "ghcr.io",
          username: "${{ github.actor }}",
          password: "${{ secrets.GITHUB_TOKEN }}",
        },
      },
      {
        name: "构建 镜像",
        uses: "docker/build-push-action@v7",
        with: {
          context: "",
          file: "",
          push: true,
          tags: "",
          outputs: "type=image,push=true,compression=zstd,compression-level=3",
          "cache-from": "type=gha",
          "cache-to": "type=gha,mode=max",
        },
      },
    ],
  };
}

export function syncJob(): Job {
  return {
    "runs-on": "ubuntu-latest",
    needs: [],
    steps: [
      { name: "检出代码", uses: "actions/checkout@v7" },
      { name: "准备同步工具", run: "bash ./sync-tool/tools.sh" },
      {
        name: "搬回国内",
        run: "./image-syncer -r 5 --proc 16 --auth ./sync-tool/auth.json --images ${syncConfigFile}",
      },
    ],
  };
}
