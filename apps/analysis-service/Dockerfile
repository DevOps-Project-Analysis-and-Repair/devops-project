####################################
# Stage 1: Build the service API.  #
####################################

# Start from base image.
FROM public.ecr.aws/lambda/nodejs:24 AS builder

# Build service API.
WORKDIR /usr/app
COPY package.json package-lock.json ./
COPY src ./src
RUN npm ci
RUN npm run build

####################################
# Stage 2: Get sonar-scanner CLI.  #
####################################
FROM sonarsource/sonar-scanner-cli:latest AS scanner

####################################
# Stage 3: Build the Lambda image. #
####################################

# Start from base image.
FROM public.ecr.aws/lambda/nodejs:24

# Install headless Java runtime.
RUN dnf -y install java-17-amazon-corretto-headless && dnf clean all

# Copy sonar-scanner into the Lambda image.
COPY --from=scanner /opt/sonar-scanner /opt/sonar-scanner
ENV PATH="/opt/sonar-scanner/bin:${PATH}"

# Let sonar-scanner store cache in writable location (/tmp).
ENV SONAR_USER_HOME = "/tmp/.sonar"

# Prepare bash script that runs sonar-scanner.
COPY run-scan.sh ./
RUN chmod +x ./run-scan.sh

# Configure the Lambda runtime to execute the handler.
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /usr/app/dist ./
CMD ["index.handler"]
