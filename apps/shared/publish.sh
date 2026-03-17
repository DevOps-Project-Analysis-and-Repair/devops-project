#!/bin/zsh

mkdir -p ../fix-service/lib/shared/
rsync -av --exclude='publish.sh' . ../fix-service/lib/shared/

mkdir -p ../upload-service/lib/shared/
rsync -av --exclude='publish.sh' . ../upload-service/lib/shared/
