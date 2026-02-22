import crypto from "crypto";
import { getConfig } from "./config";

export async function kalshiFetch(
  path: string,
  init: RequestInit & { query?: Record<string, string | number> } = {},
) {
  const { query, ...restInit } = init;
  const queryString = query
    ? "?" +
      new URLSearchParams(
        Object.entries(query).map(([k, v]) => [k, v.toString()]),
      )
    : "";

  const timestamp = Date.now().toString();
  const method = restInit.method || "GET";

  const config = getConfig();
  const message = Buffer.from(timestamp + method + path + queryString, "utf-8");
  const key = crypto.createPrivateKey(config.privateKey);

  const signature = crypto
    .sign("sha256", message, {
      key,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    })
    .toString("base64");

  const headers = {
    "KALSHI-ACCESS-KEY": config.accessKey,
    "KALSHI-ACCESS-SIGNATURE": signature,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
    ...init.headers,
  };

  let baseUrl: string = config.baseUrl;
  if (path.includes("candlesticks")) {
    baseUrl = "https://api.elections.kalshi.com/v1";
  }

  const url = baseUrl + path + queryString;

  const response = await fetch(url, {
    ...restInit,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Response error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      url,
      headers: Object.fromEntries(response.headers),
    });
    throw new Error(`Kalshi API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}
