const fs = require('fs');
const execSync = require('child_process').execSync;

const envFile = fs.readFileSync('.env', 'utf-8');
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

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1];
    let val = match[2].trim();
    if (secretsToSet.includes(key)) {
      console.log(`Setting secret: ${key}`);
      try {
        // Enclose value in quotes to handle special characters
        execSync(`npx sst secret set ${key} "${val}"`, { stdio: 'inherit' });
      } catch (e) {
        console.error(`Failed to set ${key}`);
      }
    }
  }
});
console.log("All secrets set successfully!");
