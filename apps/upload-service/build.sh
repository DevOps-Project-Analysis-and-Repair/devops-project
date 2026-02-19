#!/bin/sh

AWS_REGION=us-east-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO=upload-service

aws ecr create-repository --repository-name $REPO --region $AWS_REGION 2>/dev/null || true

aws ecr get-login-password --region $AWS_REGION
#   | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# docker build -t $REPO:latest .
# docker tag $REPO:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:latest
# docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:latest
