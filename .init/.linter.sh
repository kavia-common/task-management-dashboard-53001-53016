#!/bin/bash
cd /home/kavia/workspace/code-generation/task-management-dashboard-53001-53016/task_management_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

