#!/bin/bash
set -e

cd "$(dirname "$0")"

git add .
git commit -m "${1:-update}"
git push origin main
