#!/bin/sh
AWS_REGION=eu-west-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO=analysis-service

if [ -n "${GIT_HASH:-}" ]; then
  aws cloudformation deploy \
    --stack-name analysis-stack \
    --template-file analysis-stack.yml \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides UploadServiceImageUri=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:$GIT_HASH
else
  aws cloudformation deploy \
    --stack-name analysis-stack \
    --template-file analysis-stack.yml \
    --capabilities CAPABILITY_NAMED_IAM
fi
