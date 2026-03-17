#!/bin/zsh

mkdir -p ../fix-service/lib/shared/
rsync -av --exclude='publish.sh' . ../fix-service/lib/shared/
