#!/bin/bash
RUNS_WITH_NAME=$(gh api repos/${OWNER}/${REPO}/actions/runs --paginate -X GET -f status=completed -f per_page=100 | jq -r '.workflow_runs[].id')
# 循环 RUNS_WITH_NAME
for RUN_ID in $RUNS_WITH_NAME
do
    echo "现在删除工作流运行 ID: ${RUN_ID}"
    gh api -X DELETE /repos/${OWNER}/${REPO}/actions/runs/${RUN_ID} --silent
done
