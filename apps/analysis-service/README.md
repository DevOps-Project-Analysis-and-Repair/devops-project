# Analysis service
Microservice for managing the analysis of the projects

The service dependencies are the upload-service and the external Sonarcube instance

## Documentation
The API spec can be found in openapi.yml

## Docker build instructions
Build the Docker image with the docker build command. The following example names the image docker-image and gives it the test tag. To make your image compatible with Lambda, you must use the --provenance=false option. [aws docs](https://docs.aws.amazon.com/lambda/latest/dg/typescript-image.html)
```docker buildx build --platform linux/amd64 --provenance=false -t analysis-service:latest .```

## Running the dockerfile locally
```docker run --platform linux/amd64 -p 9000:8080 analysis-service:latest```
