### Docker build instructions
Build the Docker image with the docker build command. The following example names the image docker-image and gives it the test tag. To make your image compatible with Lambda, you must use the --provenance=false option. [aws docs](https://docs.aws.amazon.com/lambda/latest/dg/typescript-image.html)
```docker buildx build --platform linux/amd64 --provenance=false -t upload-service:latest .```

## Running the dockerfile locally
```docker run --platform linux/amd64 -p 9000:8080 upload-service:latest```

## Using the API

### Creating a new project
```sh
curl --request POST --url https://p336yzymi2.execute-api.eu-west-1.amazonaws.com/upload-service/projects
```
Will result in a request that looks like the following:

```json
{
	"projectId": "94711667-253c-4f8e-9649-1265d66c83be",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYXJmb28iLCJwcm9qZWN0X2lkIjoiOTQ3MTE2NjctMjUzYy00ZjhlLTk2NDktMTI2NWQ2NmM4M2JlIiwiZXhwIjoxNzcyOTYxMjg4LCJpYXQiOjE3NzIwOTcyODh9.MEHlPVaGqQBIKF6R58ni2Ne4y--C1B3sx_z2ITxVIeo"
}
```
The token is used as a header (X-Project-Token) for uploading a file to the project

### Uploading a file to a project
```sh
curl --request POST \
  --url https://p336yzymi2.execute-api.eu-west-1.amazonaws.com/upload-service/projects/f9521144-b4c3-49a3-bbc3-e2ee6e7008ab/files \
  --header 'Content-Type: application/javascript' \
  --header 'X-File-Name: foobar.tsx' \
  --header 'X-Project-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYXJmb28iLCJwcm9qZWN0X2lkIjoiZjk1MjExNDQtYjRjMy00OWEzLWJiYzMtZTJlZTZlNzAwOGFiIiwiZXhwIjoxNzcyOTAxNzc5LCJpYXQiOjE3NzIwMzc3Nzl9.v4AEPmtgSxxKxaKRz8y3_a--RTM1zOPkdEOm1SoLbIU' \
  --data (base64 encoded file)
```
With the headers:
 - Content-Type, the mimetype of the file, will be used in the response
 - X-File-Name, the filename of the eventual response
 - X-Project-Token, the token received from the new project endpoint. It has a lifetime of 10 days, and is there to prevent malicious mutations to a project.

### Receiving all projects
```sh
curl --request GET \
--url https://p336yzymi2.execute-api.eu-west-1.amazonaws.com/upload-service/projects/
```

### Receiving project
```sh
curl --request GET \
--url https://p336yzymi2.execute-api.eu-west-1.amazonaws.com/upload-service/projects/f9521144-b4c3-49a3-bbc3-e2ee6e7008ab
```

### Downloading a file of a project
```sh
curl --request GET \
--url https://p336yzymi2.execute-api.eu-west-1.amazonaws.com/upload-service/projects/f9521144-b4c3-49a3-bbc3-e2ee6e7008ab/files/15a2acc4-cace-41a1-818a-78515039b30d
```
