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
	OPENSEARCH_ENDPOINT
	ES_API_KEY
	NEON_DB_URL
Amplify Params - DO NOT EDIT */

const express = require("express");
const bodyParser = require("body-parser");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const { Client } = require("@opensearch-project/opensearch");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { AwsSigv4Signer } = require("@opensearch-project/opensearch/aws");

// declare a new express app
const app = express();
app.use(bodyParser.json());

app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Or specify your Amplify app's domain
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, *"
  );
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

const client = new Client({
  ...AwsSigv4Signer({
    region: "us-east-2",
    service: "es",
    getCredentials: () => {
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  requestTimeout: 60000,
  node: process.env.OPENSEARCH_ENDPOINT,
});

app.post("/search", async (req, res) => {
  const { query } = req.query || {};
  try {
    if (!query)
      return res.status(400).json({ msg: "Please provide a search query!" });

    const result = await client.search({
      index: "snippets",
      body: {
        query: {
          bool: {
            should: [
              {
                match_phrase_prefix: {
                  "title.autocomplete": {
                    query,
                    analyzer: "underscore_analyzer", // Use the same analyzer for searching
                  },
                },
              },
              {
                match: {
                  extension: {
                    query,
                    analyzer: "standard", // Standard analyzer works fine for exact matches here
                  },
                },
              },
            ],
          },
        },
      },
    });

    const hits = result.body.hits.hits;
    res.json(hits);
  } catch (err) {
    console.error(err);
    res.status(500).send("Search failed");
  }
});
// app.all("*", (req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
