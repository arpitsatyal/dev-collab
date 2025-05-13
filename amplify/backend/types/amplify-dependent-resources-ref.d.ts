export type AmplifyDependentResourcesAttributes = {
  "api": {
    "searchapi": {
      "ApiId": "string",
      "ApiName": "string",
      "RootUrl": "string"
    }
  },
  "function": {
    "devcollabsearch": {
      "Arn": "string"
    },
    "searchService": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    }
  }
}