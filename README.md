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
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5000` (auto-proxied via Vite `/api`)

### 2. Standalone Production Mode:
```bash
npm run build
npm start
```
Express will serve both the backend API and frontend SPA on `http://localhost:5000`.

---

## Part 2 & Part 3: ESP32 Hardware & Real Connection Architecture

### 1. Network Architecture
- **Local ESP32 Mode (Recommended for testing):**
  Frontend running at `http://localhost:5173` communicates directly over local Wi-Fi with `http://<ESP32_IP>/status` and `http://<ESP32_IP>/api/data`. Both computer and ESP32 must be on the same local Wi-Fi network.
- **Production / Cloud Mode (e.g. Vercel):**
  Web browsers enforce strict Mixed Content / Private Network Access boundaries preventing HTTPS websites (`https://veg-system.vercel.app`) from directly querying private local IP addresses (`http://192.168.x.x`). Production cloud deployments route telemetry through an IoT Broker (MQTT / Cloud REST) into the database.

### 2. Hardware Pinout & Wiring
- **ESP32 DevKit V1**
- **DHT22 Data:** GPIO 4 (3.3V VCC, 10kΩ pull-up resistor)
- **MQ-135 Analog A0:** GPIO 34 (ADC1_CH6) via **Voltage Divider** (R1 = 1kΩ, R2 = 2kΩ) to ensure analog voltage never exceeds 3.3V!
- **Status LEDs:** Green (GPIO 18 - Fresh), Yellow (GPIO 19 - Warning), Red (GPIO 23 - Critical Spoilage Risk)
- **OLED (Optional):** SDA on GPIO 21, SCL on GPIO 22

### 3. ESP32 HTTP Server Endpoints
Every response includes `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Private-Network: true`.

#### `GET /status`
```json
{
  "device": "ESP32-001",
  "status": "connected",
  "ip": "192.168.1.105",
  "network": "Wi-Fi",
  "firmware": "v2.5.0"
}
```

#### `GET /api/data`
```json
{
  "device": "ESP32-001",
  "temperature": 28.5,
  "humidity": 72.0,
  "gas_level": 420,
  "status": "FRESH",
  "spoilage_risk": 18
}
```
If DHT22 reading returns NaN, returns `{ "error": "DHT22_READ_FAILED" }` without crashing or sending fake values.

---

## Final Verification & Testing Procedure (Section 20)

1. **Upload ESP32 code:** Open `esp32/vegsense_esp32.ino` in Arduino IDE, set Wi-Fi SSID/password, and flash to ESP32 DevKit V1.
2. **Open Arduino Serial Monitor (115200 baud):** Verify output:
   ```
   Connecting to WiFi...
   ....
   WiFi connected!
   ESP32 IP Address: 192.168.1.105
   HTTP server started
   ```
3. **Verify from browser on same Wi-Fi:** Open `http://192.168.1.105/status` -> returns `{"device":"ESP32-001","status":"connected"}`.
4. **Verify sensor data:** Open `http://192.168.1.105/api/data` -> returns actual sensor JSON.
5. **Run frontend locally:** `npm run dev` and open `http://localhost:5173/connect-device`.
6. **Enter IP:** Enter `192.168.1.105` and click **Connect Device**.
7. **Verify stage progression:** Shows `Checking ESP32...`, `Checking Wi-Fi...`, `Checking HTTP server...`, `Reading sensor data...`, and connects.
8. **Navigate to Dashboard:** Automatically redirects to `/dashboard`.
9. **Live Telemetry:** Dashboard displays actual DHT22 and MQ-135 readings with 5-second polling updates without page reload.
10. **Offline Detection:** Disconnect ESP32 power or Wi-Fi -> Dashboard switches to **Device Offline** displaying last known reading with Reconnect button. Reconnecting restores live telemetry.
