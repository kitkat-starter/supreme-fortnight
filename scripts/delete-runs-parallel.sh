#!/bin/bash
# set -x
gh config set prompt disabled
GH_USERNAME=kitkat-starter
REPO_NAME=silver-octo-succotash
RUNS_WITH_NAME=$(gh api repos/${GH_USERNAME}/${REPO_NAME}/actions/runs --paginate -X GET -f status=completed -f per_page=100 | jq -r '.workflow_runs[].id')
echo "${RUNS_WITH_NAME}" | parallel --jobs 50 -I% gh api -X DELETE /repos/${GH_USERNAME}/${REPO_NAME}/actions/runs/% --silent
