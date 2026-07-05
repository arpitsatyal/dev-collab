const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Helper to find files up the directory tree
function findUp(filename, startDir) {
  let dir = startDir;
  while (true) {
    const file = path.join(dir, filename);
    if (fs.existsSync(file)) return file;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// 1. Locate the workspace root by looking for sst.config.ts
const currentDir = __dirname;
const sstConfigPath = findUp('sst.config.ts', currentDir);
if (!sstConfigPath) {
  console.error('Error: Could not find sst.config.ts in this directory or any parent directories.');
  process.exit(1);
}

const workspaceRoot = path.dirname(sstConfigPath);

// 2. Locate the api folder .env file
const envFilePath = path.join(workspaceRoot, 'devcollab-api', '.env');
if (!fs.existsSync(envFilePath)) {
  console.error(`Error: Could not find .env file at ${envFilePath}`);
  process.exit(1);
}

console.log(`Loading secrets from: ${envFilePath}`);
console.log(`Parsing secrets from: ${sstConfigPath}`);

// 3. Parse secrets from sst.config.ts
const sstConfigContent = fs.readFileSync(sstConfigPath, 'utf8');
const secretRegex = /new\s+sst\.Secret\(\s*["']([^"']+)["']\s*\)/g;
const declaredSecrets = new Set();
let match;
while ((match = secretRegex.exec(sstConfigContent)) !== null) {
  declaredSecrets.add(match[1]);
}

if (declaredSecrets.size === 0) {
  console.log('No secrets found in sst.config.ts.');
  process.exit(0);
}

console.log(`Found ${declaredSecrets.size} secrets declared in sst.config.ts.`);

// 4. Parse .env file
const envContent = fs.readFileSync(envFilePath, 'utf8');
const envLines = envContent.split(/\r?\n/);
const envVars = {};

for (const line of envLines) {
  const trimmed = line.trim();
  // Skip empty lines or comments
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const equalsIndex = trimmed.indexOf('=');
  if (equalsIndex === -1) continue;
  
  const key = trimmed.substring(0, equalsIndex).trim();
  let val = trimmed.substring(equalsIndex + 1).trim();
  
  // Remove wrapping quotes if present
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  
  envVars[key] = val;
}

// 5. Parse command line arguments for stage (e.g., node set-secrets.js --stage production)
const args = process.argv.slice(2);
const stageIdx = args.indexOf('--stage');
const stage = stageIdx !== -1 && args[stageIdx + 1] ? args[stageIdx + 1] : null;

const stageArgs = stage ? ['--stage', stage] : [];
if (stage) {
  console.log(`Targeting stage: ${stage}`);
}

// 6. Set secrets in SST
let successCount = 0;
let failCount = 0;
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

for (const secretName of declaredSecrets) {
  if (secretName in envVars) {
    const secretValue = envVars[secretName];
    console.log(`\n--- Setting SST secret: ${secretName} ---`);
    
    // Execute: npx sst secret set <key> <val> [--stage <stage>]
    const cmdArgs = ['sst', 'secret', 'set', secretName, secretValue, ...stageArgs];
    
    const result = spawnSync(npxCmd, cmdArgs, {
      cwd: workspaceRoot,
      stdio: 'inherit',
    });
    
    if (result.status === 0) {
      successCount++;
    } else {
      console.error(`Failed to set ${secretName}. Exit code: ${result.status}`);
      failCount++;
    }
  } else {
    console.log(`Secret ${secretName} is declared in sst.config.ts but not found in .env file.`);
  }
}

console.log(`\nDone! Successfully set ${successCount} secrets. Failed to set ${failCount} secrets.`);
