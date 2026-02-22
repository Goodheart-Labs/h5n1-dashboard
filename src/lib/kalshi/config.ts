// Split the private key back into lines when loaded from env
function formatPrivateKey(key: string) {
  const lines = key.split("\\n");
  return [
    "-----BEGIN RSA PRIVATE KEY-----",
    ...lines,
    "-----END RSA PRIVATE KEY-----",
  ].join("\n");
}

export function getConfig() {
  if (!process.env.KALSHI_ACCESS_KEY || !process.env.KALSHI_PRIVATE_KEY) {
    throw new Error("Missing Kalshi API credentials");
  }

  return {
    accessKey: process.env.KALSHI_ACCESS_KEY,
    privateKey: formatPrivateKey(process.env.KALSHI_PRIVATE_KEY),
    baseUrl: "https://api.elections.kalshi.com/trade-api/v2",
  } as const;
}
