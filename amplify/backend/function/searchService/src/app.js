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
const { Client } = require("@elastic/elasticsearch");

// declare a new express app
const app = express();
app.use(bodyParser.json());

app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ES_API_KEY,
  },
});

app.post("/search", async function (req, res) {
  try {
    const { query } = req.query || {};
    if (!query)
      return res.status(400).json({ msg: "Please provide a search query!" });
    const result = await esClient.search({
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

    const hits = result.hits.hits;
    res.json(hits);
  } catch (err) {
    console.error(err);
    res.status(500).send("Search failed, try again later!");
  }
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
