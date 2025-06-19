export const getSecret = (key: string) => {
  try {
    const secrets = JSON.parse(process.env.secrets || "{}");
    return secrets[key];
  } catch {
    return "";
  }
};
