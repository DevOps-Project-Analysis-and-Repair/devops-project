# devops-project

## Preview
A YouTube video of the final product can be watched here:
[![devops-video](https://img.youtube.com/vi/KuFuvvfqTkA/0.jpg)](https://www.youtube.com/watch?v=KuFuvvfqTkA)

## Frontend
The frontend is a SPA application that is deployed on AWS CDN (cloudfront). The architecture of the application is a React app with the Tan-stack router. For the UI library React-MUI is used.

The frontend communicates with the backend via only REST-api calls directly to the  different services within the backend.

## Backend 
Each service has an open API specification. To view the open API specification of the gateway, open 'documentation/openapi.yaml'. To view it with swagger: visit https://editor.swagger.io/ and copy and paste in the yaml from documentation/openapi.yaml.


To bundle each service together to the gateway open API specification, the following command is used:  
```
npx @redocly/cli join \
  ./documentation/root.yaml \
  ./apps/fix-service/openapi.yaml \
  ./apps/upload-service/openapi.yaml \
  ./apps/analysis-service/openapi.yaml \
  -o ./documentation/openapi.yaml 
```

## Repository secrets for required deployment
These secrets should be configured within the Github secret environment.
```
AWS_ACCESS_KEY_ID: string
AWS_ACCOUNT_ID: string	
AWS_SECRET_ACCESS_KEY: string

// Keys for the authentication for the JWT signing/verification	
JWT_PRIVATE_KEY: string
JWT_PUBLIC_KEY: string

OPENAI_API_KEY: string
SONAR_TOKEN: string
```
