# GitHub Actions Setup

## Required Repository Secrets

To run tests in GitHub Actions, you need to add the following secrets to your repository:

**Go to:** `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PINECONE_API_KEY` | Your Pinecone API key | `pcsk_...` |
| `PINECONE_INDEX` | Your Pinecone index name | `dev-collab-embeddings` |
| `TOGETHER_API_KEY` | Your Together AI API key | `bcbc203f...` |
| `DATABASE_URL` | Your database connection string | `postgresql://...` |
| `NEXTAUTH_SECRET` | NextAuth secret for auth | (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | NextAuth URL | `https://your-app.com` |

## Workflow Triggers

The workflow runs on:
- Push to `main` or `dev` branches
- Pull requests to `main` or `dev` branches

## Expected Runtime

Tests take approximately **60-70 seconds** due to real API calls to Pinecone and Together AI.
