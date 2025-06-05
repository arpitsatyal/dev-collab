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

/**********************
 * Example get method *
 **********************/

const client = new Meilisearch({
  host: process.env.MEILISEARCH_SERVER,
});

const index = client.index("docs");

app.post("/sync", async function (req, res) {
  try {
    const doc = req.body.doc;
    if (!doc) {
      return res.status(404).json({ msg: "doc not found!" });
    }
    const document = { ...doc, type: req.body.type };
    await index.addDocuments([document]);

    return res.status(200).json({ msg: `✅ doc ${doc.id} indexed` });
  } catch (err) {
    console.error(`❌ Failed to index doc`, err.message);
    return res.status(400).json({ msg: `❌ Failed to index doc` });
  }
});

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
