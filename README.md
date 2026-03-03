# MTN Community Shop Partner Management Platform

Full end-to-end partner management system enabling partner onboarding, admin verification workflows, agent and business management, document handling, and operational requests.

## Tech Stack

Next.js 16 • TypeScript • PostgreSQL + Prisma • NextAuth • Tailwind CSS

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database and SMTP credentials

# Initialize database (see Database Setup below)
pnpm db:generate
npx prisma migrate deploy
pnpm db:seed

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Setup

The MCS portal uses a standard PrismaClient connecting directly to PostgreSQL — no Accelerate, no connection pooling proxy required.

1. Create a PostgreSQL database (e.g., `mtn_mcs_portal`)
2. Set environment variable:
   ```env
   DATABASE_URL="postgres://user:pass@host:5432/mtn_mcs_portal"
   ```
3. Generate client and apply migrations:
   ```bash
   pnpm db:generate
   npx prisma migrate deploy
   pnpm db:seed
   ```

The schema has **25 tables** covering auth, partner management, onboarding requests, operational requests, documents, notifications, and audit logging.

## Configuration

### Environment Variables (.env.local)

```env
# Database
DATABASE_URL="postgres://user:pass@host:5432/mtn_mcs_portal"

# Auth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="MTN Portal <noreply@mtn.com>"
SMTP_DEFAULT_RECIPIENT="admin@example.com"

# Maintenance
MAINTENANCE_TOKEN="your-secret-token"
```

**Gmail Setup:** Enable 2FA → Generate App Password → Use as `SMTP_PASSWORD`

### Storage Providers

| Provider | Variables Required |
|----------|-------------------|
| **Vercel Blob** (default) | `STORAGE_PROVIDER=vercel`, `NEXT_PUBLIC_STORAGE_PROVIDER=vercel`, `BLOB_READ_WRITE_TOKEN` |
| **Azure Blob** | `STORAGE_PROVIDER=azure`, `NEXT_PUBLIC_STORAGE_PROVIDER=azure`, `AZURE_STORAGE_CONNECTION_STRING`, optional `AZURE_STORAGE_CONTAINER` |

## Commands

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run Prisma migrations (dev)
pnpm db:studio    # Open Prisma Studio
pnpm db:seed      # Seed database with initial data
```

## Usage

### Partner Flow
Register at `/auth/register` → Complete onboarding → Submit for review → Manage agents & businesses → Submit requests

### Admin Login
Visit `/admin` → Enter email → Receive OTP → Enter code → Access dashboard

### Admin Workflows
Dashboard → Review partner submissions | Manage agents & businesses | Send forms for signing | Handle feedback & requests | View audit logs

### Onboard Requests
Coordinators create requests → Manager review → Senior Manager review → Governance check → Approved/Denied

## Project Structure

```
src/
├── app/                  # Next.js pages & API routes
│   ├── admin/           # Admin portal routes
│   ├── partner/         # Partner portal routes
│   ├── auth/            # Authentication routes
│   └── api/             # Backend endpoints
├── components/          # Reusable UI components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
└── lib/                 # Utilities (auth, email, prisma, storage)
prisma/
├── schema.prisma        # Database schema (25 tables)
└── seed.ts              # Database seed script
```

## Key Features

- Partner self-service onboarding with draft save
- Multi-role admin system (Full, Manager, Coordinator, Senior Manager, Governance)
- Region-scoped access control for Coordinators
- Multi-step onboard request approval workflow
- Agent and business submission with admin review
- Document signing (form requests with e-signatures)
- Pay slip uploads
- Training, restock, and feedback request management
- Real-time notification system
- Comprehensive audit logging
- Dark/light mode
- Mobile responsive

## Maintenance Cron

Set up a cron job to call the maintenance endpoint periodically (e.g., daily):

```
POST https://<your-domain>/api/admin/maintenance
Header: Authorization: Bearer <MAINTENANCE_TOKEN>
```

Handles reminder emails and auto-expiry of stale submissions.

## Troubleshooting

**Email not working:** Check SMTP credentials, use Gmail App Password (not regular password)
**OTP not arriving:** Verify the admin email exists in the database
**Build errors:** Run `pnpm dev:clean` or `rm -rf .next && pnpm build`
**Database issues:** Run `npx prisma migrate reset` (warning: drops all data)
**Storage uploads failing:** Verify `BLOB_READ_WRITE_TOKEN` or Azure connection string

---

**Version:** 0.1.0 • **Built with:** Next.js 16.1.2 • **License:** © 2026 MTN
