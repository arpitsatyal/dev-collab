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
	NEON_DB_URL
Amplify Params - DO NOT EDIT */

const express = require("express");
const bodyParser = require("body-parser");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const { Meilisearch } = require("meilisearch");

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

const client = new Meilisearch({
  host: process.env.MEILISEARCH_SERVER,
});

const index = client.index("docs");

app.post("/search", async (req, res) => {
  const { query } = req.query || {};
  try {
    if (!query) throw new Error("query isnt provided");
    const result = await index.search(query, {
      attributesToHighlight: ["title"],
      cropLength: 20,
    });

    res.json(result.hits);
  } catch (err) {
    console.error(err);
    res.status(500).send("Search failed");
  }
});

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
