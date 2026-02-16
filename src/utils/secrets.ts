export const getSecret = (key: string) => {
  // First, try direct environment variable (for GitHub Actions, local .env)
  if (process.env[key]) {
    return process.env[key];
  }

  // Fall back to JSON secrets format (AWS, production)
  try {
    const secrets = JSON.parse(process.env.secrets || "{}");
    return secrets[key];
  } catch {
    return "";
  }
};
