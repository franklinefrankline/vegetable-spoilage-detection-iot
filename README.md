# Intelligent Vegetable Storage and Spoilage Detection System
### Part 1: Authentication & Device Gateway Module

A professional IoT-based vegetable storage monitoring web application. The physical prototype utilizes an **ESP32 microcontroller**, a **DHT22** temperature & relative humidity sensor, an **MQ-135** air quality and volatile gas sensor, an **I2C 0.96" OLED display**, and **Tri-Color LED indicators** (Green: Fresh, Yellow: Warning, Red: Spoilage Alert).

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React 19)                  │
│  - Vanilla CSS Design System (Agricultural Theme)      │
│  - Central Auth Context & Session Management           │
│  - Client Router with Protected & Public Guards        │
│  - Real-time Form Validation & Toast Notifications     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP /api/auth/*
┌──────────────────────────▼─────────────────────────────┐
│                 Backend Server (Express 5)             │
│  - JWT Bearer Authentication                           │
│  - Password Hashing (bcryptjs, 10 rounds)             │
│  - Node.js Built-in SQLite (DatabaseSync)              │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│            SQLite Database (server/database.sqlite)     │
│  - users (id, name, email, password_hash, timestamps) │
│  - password_resets (id, email, token, expires_at, used)│
└────────────────────────────────────────────────────────┘
```

---

## Navigation & Routing Specifications

### Public Routes
* `/login` - Sign in with registered credentials. Includes "Remember me" and show/hide password toggle.
* `/register` - Account registration with real-time password criteria checklist. Automatically authenticates and redirects to `/connect-device`.
* `/forgot-password` - Requests reset link. Generic confirmation prevents email enumeration.
* `/reset-password` - Resets password with one-time security token (supports `?token=...`).

### Protected Routes (Requires Active Authentication)
* `/connect-device` - Default landing route after login or registration.
* `/dashboard` - Telemetry dashboard (Part 2).
* `/sensors` - Real-time DHT22 & MQ-135 sensor readings (Part 2).
* `/alerts` - Critical spoilage alarm log (Part 2).
* `/reports` - Produce preservation history (Part 2).
* `/settings` - Hardware threshold configurations (Part 2).

> **Route Guard Rules:**
> 1. Unauthenticated users attempting any protected route are automatically redirected to `/login`.
> 2. Authenticated users attempting `/login` or `/register` are redirected to `/connect-device`.

---

## Backend API Specification

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| `POST` | `/api/auth/register` | Creates new user, hashes password, returns JWT token & user object | No |
| `POST` | `/api/auth/login` | Validates credentials against hashed password, issues JWT | No |
| `POST` | `/api/auth/logout` | Revokes session on client and server | Yes |
| `POST` | `/api/auth/forgot-password` | Generates 1-hour secure reset token | No |
| `POST` | `/api/auth/reset-password` | Updates password hash and marks token as used | No |
| `GET`  | `/api/auth/me` | Validates active Bearer JWT token against database | Yes |

---

## Database Schema

### `users` Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `password_resets` Table
```sql
CREATE TABLE password_resets (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Running the Application Locally

### 1. Unified Development Mode (Runs Express API & Vite Dev Server):
```bash
npm run dev
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:5000` (auto-proxied via Vite `/api`)

### 2. Standalone Production Mode:
```bash
npm run build
npm start
```
Express will serve both the backend API and frontend SPA on `http://localhost:5000`.

### 3. Running Authentication Automated Test Suite:
```bash
node test_api.mjs
```
Runs 13 end-to-end unit tests covering password complexity, duplicate emails, bcrypt verification, session persistence, and reset token invalidation.
