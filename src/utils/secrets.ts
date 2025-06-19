export const getSecret = (key: string): string | undefined => {
  try {
    const secrets = JSON.parse(process.env.secrets || "{}");
    return secrets[key];
  } catch {
    return undefined;
  }
};
