# MTN Community Shop Partner Management Platform

## Setup

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

## Environment Variables

Required:
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_DEFAULT_RECIPIENT`

Optional:
- `MAINTENANCE_TOKEN` (protects `/api/admin/maintenance`)
- `STORAGE_PROVIDER` (`vercel` | `azure`, default: `vercel`)
- `NEXT_PUBLIC_STORAGE_PROVIDER` (`vercel` | `azure`, default: `vercel`)
- `BLOB_READ_WRITE_TOKEN` (required when using Vercel Blob)
- `AZURE_STORAGE_CONNECTION_STRING` (required when using Azure Blob)
- `AZURE_STORAGE_CONTAINER` (optional, default: `mtn-community-shop`)

## Storage Providers

### Vercel Blob (default)
- Set `STORAGE_PROVIDER=vercel`
- Set `NEXT_PUBLIC_STORAGE_PROVIDER=vercel`
- Set `BLOB_READ_WRITE_TOKEN`

### Azure Blob
- Set `STORAGE_PROVIDER=azure`
- Set `NEXT_PUBLIC_STORAGE_PROVIDER=azure`
- Set `AZURE_STORAGE_CONNECTION_STRING`
- Optional: `AZURE_STORAGE_CONTAINER`
- Install the Azure SDK:
  ```bash
  pnpm add @azure/storage-blob
  ```

Note: Azure container access should allow public reads (or you can add SAS URLs later).

## Database

The app uses Prisma with `DATABASE_URL`. Recommended Microsoft option is **Azure Database for PostgreSQL** (no code changes needed).

If the client requires **Azure SQL Server**, Prisma provider changes and migrations must be reviewed.

## Maintenance Cron

Use any cron service (cron-job.org, etc.) to call:

- `POST https://<your-domain>/api/admin/maintenance`
- Header: `Authorization: Bearer <MAINTENANCE_TOKEN>`

This endpoint handles reminder emails and auto-expiry.
