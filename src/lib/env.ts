type EnvKey =
  | "DATABASE_URL"
  | "AUTH_SECRET"
  | "NEXTAUTH_URL"
  | "BLOB_READ_WRITE_TOKEN"
  | "SMTP_HOST"
  | "SMTP_PORT"
  | "SMTP_SECURE"
  | "SMTP_USER"
  | "SMTP_PASSWORD"
  | "SMTP_FROM"
  | "SMTP_DEFAULT_RECIPIENT"
  | "MAINTENANCE_TOKEN"
  | "STORAGE_PROVIDER"
  | "AZURE_STORAGE_CONNECTION_STRING"
  | "AZURE_STORAGE_CONTAINER";

function requireEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  authSecret: process.env.AUTH_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpSecure: process.env.SMTP_SECURE,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM,
  smtpDefaultRecipient: process.env.SMTP_DEFAULT_RECIPIENT,
  maintenanceToken: process.env.MAINTENANCE_TOKEN,
  storageProvider: process.env.STORAGE_PROVIDER,
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  azureStorageContainer: process.env.AZURE_STORAGE_CONTAINER,
};

export const requiredEnv = {
  get databaseUrl() {
    return requireEnv("DATABASE_URL");
  },
  get authSecret() {
    return requireEnv("AUTH_SECRET");
  },
  get nextAuthUrl() {
    return requireEnv("NEXTAUTH_URL");
  },
  get blobReadWriteToken() {
    return requireEnv("BLOB_READ_WRITE_TOKEN");
  },
  get smtpHost() {
    return requireEnv("SMTP_HOST");
  },
  get smtpPort() {
    return requireEnv("SMTP_PORT");
  },
  get smtpSecure() {
    return requireEnv("SMTP_SECURE");
  },
  get smtpUser() {
    return requireEnv("SMTP_USER");
  },
  get smtpPassword() {
    return requireEnv("SMTP_PASSWORD");
  },
  get smtpFrom() {
    return requireEnv("SMTP_FROM");
  },
  get smtpDefaultRecipient() {
    return requireEnv("SMTP_DEFAULT_RECIPIENT");
  },
};
