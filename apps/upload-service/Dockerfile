FROM public.ecr.aws/lambda/nodejs:24 AS builder
WORKDIR /usr/app
COPY package.json ./package.json
COPY src/* ./src/
RUN npm install
RUN npm run build
    
FROM public.ecr.aws/lambda/nodejs:24
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /usr/app/dist/* ./

CMD ["index.handler"]
