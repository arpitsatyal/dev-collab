const fs = require('fs');
const execSync = require('child_process').execSync;

const envFile = fs.readFileSync('devcollab-api/.env', 'utf-8');
const secretsToSet = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "TOGETHER_API_KEY",
  "LIVEBLOCKS_SECRET_KEY",
  "QSTASH_TOKEN",
  "QSTASH_CURRENT_SIGNING_KEY",
  "QSTASH_NEXT_SIGNING_KEY",
  "PINECONE_API_KEY",
  "GROQ_API_KEY",
  "MEILISEARCH_API_KEY"
];

envFile.split(/\r?\n/).forEach(line => {
  if (!line || !line.includes('=')) return;
  const splitIdx = line.indexOf('=');
  const key = line.substring(0, splitIdx).trim();
  const val = line.substring(splitIdx + 1).trim();
  
  if (secretsToSet.includes(key)) {
    console.log(`Setting secret: ${key}`);
    try {
      execSync(`npx sst secret set ${key} "${val}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed to set ${key}`, e.message);
    }
  }
});
console.log("Done");
