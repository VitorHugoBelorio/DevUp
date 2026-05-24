import crypto from "node:crypto";
import fs from "node:fs/promises";
import { AiConfigurationError, AiResponseError } from "@/lib/ai/errors";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function parseServiceAccountJson(value: string): ServiceAccountCredentials {
  const parsed = JSON.parse(value) as ServiceAccountCredentials;

  if (!parsed.client_email || !parsed.private_key) {
    throw new AiConfigurationError("Service account JSON must include client_email and private_key.");
  }

  return {
    ...parsed,
    private_key: parsed.private_key.replace(/\\n/g, "\n")
  };
}

async function getServiceAccountCredentials(): Promise<ServiceAccountCredentials> {
  if (process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON) {
    return parseServiceAccountJson(process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON);
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsPath) {
    throw new AiConfigurationError(
      "Configure VERTEX_AI_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS or VERTEX_AI_ACCESS_TOKEN."
    );
  }

  return parseServiceAccountJson(await fs.readFile(credentialsPath, "utf8"));
}

function createJwt(credentials: ServiceAccountCredentials): string {
  const tokenUri = credentials.token_uri || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform"
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = crypto.createSign("RSA-SHA256").update(signingInput).sign(credentials.private_key);

  return `${signingInput}.${base64Url(signature)}`;
}

export async function getGoogleAccessToken(): Promise<string> {
  const explicitToken = process.env.VERTEX_AI_ACCESS_TOKEN?.trim();

  if (explicitToken) {
    return explicitToken;
  }

  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) {
    return cachedToken.accessToken;
  }

  const credentials = await getServiceAccountCredentials();
  const tokenUri = credentials.token_uri || "https://oauth2.googleapis.com/token";
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: createJwt(credentials)
    })
  });
  const data = (await response.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  } | null;

  if (!response.ok || !data?.access_token) {
    throw new AiResponseError(
      data?.error_description || data?.error || `Google OAuth token request failed with status ${response.status}.`
    );
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000
  };

  return cachedToken.accessToken;
}
