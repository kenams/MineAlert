import fs from "node:fs";
import path from "node:path";

const LOCAL_ENV_PATH = path.join(process.cwd(), ".env.local");
const localEnvCache = new Map<string, string>();

function loadLocalEnvFile(): void {
  if (!fs.existsSync(LOCAL_ENV_PATH) || localEnvCache.size > 0) {
    return;
  }

  const content = fs.readFileSync(LOCAL_ENV_PATH, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    localEnvCache.set(key, value);
  }
}

export function readEnvValue(name: string): string | undefined {
  loadLocalEnvFile();
  const processValue = process.env[name]?.trim();

  if (processValue) {
    return processValue;
  }

  const localValue = localEnvCache.get(name)?.trim();
  return localValue || undefined;
}

export function requireEnvValue(name: string): string {
  const value = readEnvValue(name);

  if (!value) {
    throw new Error(`Missing required environment variable "${name}" for E2E tests.`);
  }

  return value;
}
