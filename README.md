# ZIMRA Admin Portal

A **separate** system-owner portal for onboarding and managing companies, their devices, and monitoring all fiscal operations across tenants.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Go Fiscalization API                  │
│                    localhost:8080                        │
│                                                          │
│  /api/v1/*      ← Client (device/certificate) routes    │
│  /api/admin/*   ← System owner routes (JWT-protected)   │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────┐                ┌─────────────────────┐
│  Client Portal  │                │   Admin Portal      │
│  localhost:3000 │                │   localhost:3001     │
│  (zimra-        │                │   (admin-portal)     │
│   dashboard)    │                │                      │
│                 │                │  amber/gold theme    │
│  Per-company    │                │  "System Owner"      │
│  device mgmt    │                │  badge in sidebar    │
│  receipts, etc  │                │                      │
└─────────────────┘                └─────────────────────┘
```

**Key distinction:** The client portal is what you give to each company to manage their own devices and receipts. The admin portal is only for you (the system owner) to onboard companies, provision devices, and monitor everything across all tenants.

---

## Quickstart

### 1. Start the API (add admin routes to existing Go project)

The following new files were added to `fiscalization-api/`:

```
internal/models/admin.go           ← SystemStats, AuditLog, request/response types
internal/repository/admin_repository.go  ← DB queries across all tenants
internal/service/admin_service.go   ← Business logic, activation key generation
internal/handlers/admin_handler.go  ← HTTP handlers for all admin endpoints
internal/middleware/admin_auth.go   ← JWT validation for superadmin role
cmd/server/main.go                  ← Updated to wire admin routes under /api/admin/*
```

```bash
cd fiscalization-api
go run ./cmd/server/main.go
```

### 2. Start the Admin Portal

```bash
cd admin-portal
npm install
npm run dev      # runs on port 3001
```

Open `http://localhost:3001`

### 3. Login

```
Username: superadmin
Password: ZimraAdmin2024!
```

> ⚠️ Change this in `internal/service/admin_service.go` before going to production. Replace the hardcoded check with a `bcrypt` lookup against an `admin_users` database table.

---

## Admin Portal Pages

| Page | Path | Purpose |
|------|------|---------|
| Overview | `/dashboard` | System-wide KPIs, revenue across all companies, device health |
| Companies | `/companies` | Create/edit/activate companies (taxpayers) |
| Devices | `/devices` | Provision devices, reveal activation keys, block/revoke |
| Fiscal Days | `/fiscal-days` | Monitor open/closed fiscal days across all tenants |
| Receipts | `/receipts` | Cross-tenant receipt feed with validation colour filter |
| Audit Log | `/audit` | Full event trail of every admin action |
| Settings | `/settings` | API config, admin credentials note, onboarding guide |

---

## Client Onboarding Workflow

### Step 1 — Create the Company
In the **Companies** page, click **"Onboard Company"** and fill in:
- TIN (10 digits, must be unique)
- Company name
- VAT number (optional — for VAT-registered businesses)
- Fiscal day max hours (usually 24)

### Step 2 — Provision a Device per Branch
In the **Devices** page, click **"Provision Device"** and fill in:
- Device ID (numeric, pick a unique number e.g. 1001, 1002…)
- Serial number (e.g. `POS-HRE-001`)
- Assign to the company you just created
- Click **"Generate"** for the activation key, or enter your own 8-character key
- Fill in branch name and address

> ✅ After provisioning, the **activation key is shown once**. Copy it immediately — it cannot be retrieved again.

### Step 3 — Give the Client Their Credentials
Send the client:
- **Device ID** (e.g. `1001`)
- **Activation Key** (e.g. `AB12CD34`)
- **API URL** (`http://your-api-host:8080`)

The client then uses the **Client Portal** (`localhost:3000`) to:
1. Login with their username/password
2. Go to **Devices** → **Verify Taxpayer** (enters Device ID + key + serial no.)
3. **Register Device** (submits CSR, gets certificate)
4. **Issue Certificate** (activates PKI signing)
5. Open their first fiscal day and start submitting receipts

### Step 4 — Monitor from Admin Portal
Everything the client does is visible in your admin portal:
- **Fiscal Days** shows all their open/closed days
- **Receipts** shows all submitted receipts with validation colours
- **Audit Log** records every action

---

## Admin API Endpoints

All endpoints except `/api/admin/login` require:
```
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Get admin JWT token |
| GET | `/api/admin/stats` | System-wide counts + revenue |
| GET | `/api/admin/companies` | List companies (paginated, searchable) |
| POST | `/api/admin/companies` | Create new company |
| GET | `/api/admin/companies/:id` | Get company details |
| PUT | `/api/admin/companies/:id` | Update company |
| PATCH | `/api/admin/companies/:id/status` | Activate / deactivate |
| GET | `/api/admin/companies/:id/devices` | Get devices for company |
| GET | `/api/admin/devices` | List all devices (paginated) |
| POST | `/api/admin/devices` | Provision new device |
| PATCH | `/api/admin/devices/:id/status` | Block / revoke device |
| PATCH | `/api/admin/devices/:id/mode` | Switch Online ↔ Offline |
| GET | `/api/admin/fiscal-days` | Cross-tenant fiscal days |
| GET | `/api/admin/receipts` | Cross-tenant receipts (filterable) |
| GET | `/api/admin/audit` | System audit log |

---

## Design

The admin portal uses an **amber/gold** colour scheme deliberately distinct from the client portal's **green** theme, so there's zero visual confusion between the two interfaces.

The sidebar shows a **"⚡ System Owner Access"** badge and **"All tenants visible"** subtitle to make it clear you are in the admin context.

---

## Production Checklist

- [ ] Replace hardcoded admin credentials with `admin_users` DB table + bcrypt
- [ ] Set `JWT_SECRET` environment variable (strong random string)
- [ ] Add audit logging to all admin service mutations
- [ ] Run admin portal on a separate domain/subdomain (e.g. `admin.zimra-internal.co.zw`)
- [ ] Put admin portal behind VPN or IP allowlist — it should never be publicly reachable
- [ ] Enable HTTPS on both portals
- [ ] Set up database backups

