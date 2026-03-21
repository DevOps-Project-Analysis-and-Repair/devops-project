FROM public.ecr.aws/lambda/nodejs:24 AS builder
WORKDIR /usr/app

COPY shared/ ../shared/
COPY upload-service/package-lock.json ./package-lock.json
COPY upload-service/package.json ./package.json
COPY upload-service/src/ ./src/

RUN npm ci
RUN npm run build
    
FROM public.ecr.aws/lambda/nodejs:24
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /usr/app/dist/* ./

CMD ["index.handler"]
