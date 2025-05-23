/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	ELASTICSEARCH_URL
	ES_API_KEY
	NEON_DB_URL
Amplify Params - DO NOT EDIT */

const express = require("express");
const bodyParser = require("body-parser");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const { Client  } = require("@opensearch-project/opensearch");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { AwsSigv4Signer } = require("@opensearch-project/opensearch/aws");

// declare a new express app
const app = express();

// ✅ CORS middleware for all requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // or your domain
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "OPTIONS,POST,GET");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // ✅ Important: respond to preflight
  }
  next();
});

app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());


const client = new Client({
  ...AwsSigv4Signer({
    region: 'us-east-2',
    service: 'es',
    getCredentials: () => {
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  requestTimeout: 60000, 
  node: process.env.OPENSEARCH_ENDPOINT,
})


/**********************
 * Example get method *
 **********************/

app.post("/sync", async function (req, res) {
  try {
    const snippet = req.body.snippet;
    if (!snippet) {
      return res.status(404).json({ msg: "Snippet not found!" });
    }
    const snippetId = snippet.id;

    await client.index({
      index: "snippets",
      id: snippetId,
      body: {
        title: snippet.title,
        content: snippet.content,
        language: snippet.language,
        createdAt: snippet.createdAt,
        updatedAt: snippet.updatedAt,
        projectId: snippet.projectId,
        authorId: snippet.authorId,
        extension: snippet.extension,
        lastEditedById: snippet.lastEditedById,
      },
    });
    console.log(`✅ Snippet ${snippet.id} indexed`);
    return res.status(200).json({ msg: `✅ Snippet ${snippetId} indexed` });
  } catch (err) {
    console.error(`❌ Failed to index snippet`, err.message);
    return res.status(400).json({ msg: `❌ Failed to index snippet` });
  }
});

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
