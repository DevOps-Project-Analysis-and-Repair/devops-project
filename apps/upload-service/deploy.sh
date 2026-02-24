#!/bin/sh
aws cloudformation deploy --stack-name upload-service --template-file upload-service-stack.yaml --capabilities CAPABILITY_NAMED_IAM

