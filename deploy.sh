#!/bin/bash
set -e
cd "$(dirname "$0")"
msg="${1:-update}"
git add .
git commit -m "$msg" 2>/dev/null || echo "Nothing to commit"
git push origin main
