#!/bin/sh
AWS_REGION=eu-west-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO=fix-service

if [ -n "${GIT_HASH:-}" ]; then
  aws cloudformation deploy \
    --stack-name fix-stack \
    --template-file fix-stack.yml \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
      FixServiceImageUri=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:$GIT_HASH \
      OpenAIApiKey=$OPENAI_API_KEY
else
  aws cloudformation deploy \
    --stack-name fix-stack \
    --template-file fix-stack.yml \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
      OpenAIApiKey=$OPENAI_API_KEY
fi
