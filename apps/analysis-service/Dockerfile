####################################
# Stage 1: Build the service API.  #
####################################

# Start from base image.
FROM public.ecr.aws/lambda/nodejs:24 AS builder

# Build service API.
WORKDIR /usr/app

COPY shared/ ../shared/
COPY analysis-service/package-lock.json ./package-lock.json
COPY analysis-service/package.json ./package.json
COPY analysis-service/src/ ./src/

RUN npm ci
RUN npm run build

####################################
# Stage 2: Get sonar-scanner CLI.  #
####################################
FROM sonarsource/sonar-scanner-cli:12.0.0.3214_8.0.1 AS scanner

####################################
# Stage 3: Build the Lambda image. #
####################################

# Start from base image.
FROM public.ecr.aws/lambda/nodejs:24

# Install headless Java runtime.
RUN dnf -y install java-21-amazon-corretto-headless && dnf clean all

# Copy sonar-scanner into the Lambda image.
COPY --from=scanner /opt/sonar-scanner /opt/sonar-scanner
ENV PATH="/opt/sonar-scanner/bin:${PATH}"

# Let sonar-scanner store cache in writable location (/tmp).
ENV SONAR_USER_HOME="/tmp/.sonar"
ENV SONAR_SCANNER_OPTS="-Xmx2048m"

# Configure the Lambda runtime to execute the handler.
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /usr/app/dist ./
CMD ["index.handler"]
