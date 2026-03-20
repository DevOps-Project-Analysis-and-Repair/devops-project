# devops-project

## Frontend

## Backend 
Each service has an open API specification. To view the open API specification of the gateway, open 'documentation/openapi.yaml'. 

To bundle each service together to the gateway open API specification, the following command is used:  
```

npx @redocly/cli join \
  ./documentation/root.yaml \
  ./apps/fix-service/openapi.yaml \
  ./apps/upload-service/openapi.yaml \
  ./apps/analysis-service/openapi.yaml \
  -o ./documentation/openapi.yaml \
  --prefix-tags-with-info-prop title

```


